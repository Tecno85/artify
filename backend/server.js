// ========== DEPENDENCIAS ==========
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// ========== CONFIGURACIÓN INICIAL ==========
dotenv.config();

const { validarConfiguracionToken } = require('./utils/token');
validarConfiguracionToken();

const db = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const configuracionRoutes = require('./routes/configuracion.routes');
const sesionRoutes = require('./routes/sesion.routes');
const actividadRoutes = require('./routes/actividad.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const LIMITE_CUERPO_SOLICITUD = '64kb';

// ========== APP EXPRESS ==========
const app = express();
app.disable('x-powered-by');

const origenesPermitidos = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

function validarOrigenCors(origen, callback) {
  if (!origen) {
    return callback(null, true);
  }

  if (origenesPermitidos.length === 0) {
    return callback(null, process.env.NODE_ENV !== 'production');
  }

  return callback(null, origenesPermitidos.includes(origen));
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ========== MIDDLEWARES GLOBALES ==========
app.use(
  cors({
    origin: validarOrigenCors,
  })
);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(express.json({ limit: LIMITE_CUERPO_SOLICITUD }));
app.use(
  express.text({ type: 'text/plain', limit: LIMITE_CUERPO_SOLICITUD })
);

// ========== RUTA DE SALUD ==========
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    servicio: 'artify-api',
    entorno: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    await db.pool.query('SELECT 1');
    return res.status(200).json({
      ok: true,
      servicio: 'artify-api',
      baseDatos: 'disponible',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ PostgreSQL no está disponible:', error.message);
    return res.status(503).json({
      ok: false,
      servicio: 'artify-api',
      baseDatos: 'no_disponible',
      timestamp: new Date().toISOString(),
    });
  }
});

// ========== MONTAJE DE RUTAS ==========
app.use('/api', authRoutes);
app.use('/api', configuracionRoutes);
app.use('/api', sesionRoutes);
app.use('/api', actividadRoutes);
app.use('/api', adminRoutes);
app.use('/api', analyticsRoutes);

// ========== ERRORES DE SOLICITUD ==========
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'Solicitud demasiado grande' });
  }

  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo JSON no es válido' });
  }

  console.error('❌ Error no controlado en la API:', error?.message || error);
  return res.status(500).json({ mensaje: 'Error en el servidor' });
});

// ========== LIMPIEZA AUTOMÁTICA DE SESIONES INACTIVAS ==========
// Cerrar sesiones abandonadas para mantener consistencia de estado en la base de datos
const limpiezaSesionesInterval = setInterval(
  () => {
    const query = `
      WITH sesiones_cerradas AS (
        UPDATE SESION_EDICION
        SET ses_fecha_fin = NOW(),
            ses_duracion_minutos = GREATEST(
              0,
              FLOOR(EXTRACT(EPOCH FROM (NOW() - ses_fecha_inicio)) / 60)::int
            ),
            ses_estado_sesion = 'finalizada'
        WHERE ses_estado_sesion = 'activa'
          AND ses_fecha_inicio < NOW() - INTERVAL '8 hours'
        RETURNING ses_usr_id_usuario
      )
      UPDATE USUARIO u
      SET usr_sesion_activa = EXISTS (
        SELECT 1
        FROM SESION_EDICION s
        WHERE s.ses_usr_id_usuario = u.usr_id_usuario
          AND s.ses_estado_sesion = 'activa'
      )
      WHERE u.usr_id_usuario IN (
        SELECT DISTINCT ses_usr_id_usuario FROM sesiones_cerradas
      )
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('❌ Error en limpieza de sesiones:', err.message);
        return;
      }

      if (result.affectedRows > 0) {
        console.log(
          `🧹 Limpieza automática: ${result.affectedRows} usuario(s) actualizado(s) por inactividad`
        );
      }
    });
  },
  30 * 60 * 1000
);

// ========== ARRANQUE DEL SERVIDOR ==========
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// ========== CIERRE ORDENADO ==========
let cierreEnCurso = false;

function cerrarServidor(signal) {
  if (cierreEnCurso) {
    return;
  }

  cierreEnCurso = true;
  clearInterval(limpiezaSesionesInterval);
  console.log(`🛠️ Señal ${signal} recibida. Cerrando Artify...`);

  const cierreForzado = setTimeout(() => {
    console.error('❌ El cierre ordenado superó 15 segundos');
    server.closeAllConnections?.();
    process.exit(1);
  }, 15_000);
  cierreForzado.unref();

  server.close(async (errorServidor) => {
    let codigoSalida = 0;

    if (errorServidor) {
      codigoSalida = 1;
      console.error('❌ Error al cerrar el servidor HTTP:', errorServidor.message);
    }

    try {
      await db.pool.end();
      console.log('✅ Conexiones PostgreSQL cerradas correctamente');
    } catch (errorDb) {
      codigoSalida = 1;
      console.error('❌ Error al cerrar PostgreSQL:', errorDb.message);
    }

    clearTimeout(cierreForzado);
    process.exit(codigoSalida);
  });
}

process.once('SIGTERM', () => cerrarServidor('SIGTERM'));
process.once('SIGINT', () => cerrarServidor('SIGINT'));
