// ========== DEPENDENCIAS ==========
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// ========== CONFIGURACIÓN INICIAL ==========
dotenv.config();

require('./config/db');
const db = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const configuracionRoutes = require('./routes/configuracion.routes');
const sesionRoutes = require('./routes/sesion.routes');
const actividadRoutes = require('./routes/actividad.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// ========== APP EXPRESS ==========
const app = express();

// ========== MIDDLEWARES GLOBALES ==========
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// ========== MONTAJE DE RUTAS ==========
app.use('/api', authRoutes);
app.use('/api', configuracionRoutes);
app.use('/api', sesionRoutes);
app.use('/api', actividadRoutes);
app.use('/api', adminRoutes);
app.use('/api', analyticsRoutes);

// ========== LIMPIEZA AUTOMÁTICA DE SESIONES INACTIVAS ==========
// Cerrar sesiones abandonadas para mantener consistencia de estado en la base de datos
setInterval(
  () => {
    const query = `
      UPDATE SESION_EDICION
      SET ses_fecha_fin = NOW(),
          ses_estado_sesion = 'finalizada'
      WHERE ses_estado_sesion = 'activa'
      AND ses_fecha_inicio < NOW() - INTERVAL '8 hours'
    `;

    db.query(query, (err, result) => {
      if (err) {
        console.error('❌ Error en limpieza de sesiones:', err.message);
        return;
      }

      if (result.affectedRows > 0) {
        console.log(
          `🧹 Limpieza automática: ${result.affectedRows} sesión(es) cerrada(s) por inactividad`
        );
      }
    });
  },
  30 * 60 * 1000
);

// ========== ARRANQUE DEL SERVIDOR ==========
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
