// ========== DEPENDENCIAS ==========
const db = require('../config/db');
const { parsearConfiguracionAvanzada } = require('../utils/configuracion');
const {
  normalizarIdEntero,
  validarConfiguracion,
} = require('../utils/validacion');

// ========== CONSULTA DE CONFIGURACIÓN ==========
function obtenerConfiguracion(req, res) {
  const id = normalizarIdEntero(req.params.id);

  if (id === null) {
    return res
      .status(400)
      .json({ mensaje: 'Identificador de usuario inválido' });
  }

  console.log('📨 Cargando configuración de usuario');

  const query = 'SELECT * FROM CONFIGURACION WHERE cfg_usr_id_usuario = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Error al cargar configuración:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.json({ mensaje: 'sin_configuracion' });
    }

    const config = results[0];

    // Convertir la configuración avanzada en un objeto seguro para el frontend
    const avanzada = parsearConfiguracionAvanzada(
      config.cfg_configuracion_avanzada
    );

    return res.json({
      mensaje: 'ok',
      configuracion: {
        calidadExportacion: config.cfg_calidad_exportacion,
        notificacionesHabilitadas: avanzada.notificaciones ?? true,
        notificaciones: avanzada.notificaciones ?? true,
        formatoDefecto: avanzada.formatoDefecto ?? 'png',
        autoguardado: avanzada.autoguardado ?? false,
      },
    });
  });
}

// ========== GUARDADO DE CONFIGURACIÓN ==========
function guardarConfiguracion(req, res) {
  const {
    idUsuario,
    calidadExportacion,
    notificaciones,
    formatoDefecto,
    autoguardado,
  } = req.body;
  const idUsuarioNormalizado = normalizarIdEntero(idUsuario);
  const errorValidacion = validarConfiguracion({
    calidadExportacion,
    notificaciones,
    formatoDefecto,
    autoguardado,
  });

  if (idUsuarioNormalizado === null || errorValidacion) {
    return res
      .status(400)
      .json({ mensaje: errorValidacion || 'Datos de configuración inválidos' });
  }

  console.log('📨 Guardando configuración de usuario');

  // Agrupar preferencias avanzadas en el formato persistido en la base de datos
  const avanzada = JSON.stringify({
    notificaciones,
    formatoDefecto,
    autoguardado,
  });

  const queryGuardar = `
    INSERT INTO CONFIGURACION
      (cfg_usr_id_usuario, cfg_calidad_exportacion,
       cfg_configuracion_avanzada, cfg_fecha_actualizacion)
    VALUES (?, ?, ?, NOW())
    ON CONFLICT (cfg_usr_id_usuario)
    DO UPDATE SET
      cfg_calidad_exportacion = EXCLUDED.cfg_calidad_exportacion,
      cfg_configuracion_avanzada = EXCLUDED.cfg_configuracion_avanzada,
      cfg_fecha_actualizacion = NOW()
  `;

  return db.query(
    queryGuardar,
    [idUsuarioNormalizado, calidadExportacion, avanzada],
    (error) => {
      if (error) {
        if (error.code === '23503') {
          return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        console.error('❌ Error al guardar configuración:', error.message);
        return res
          .status(500)
          .json({ mensaje: 'Error al guardar configuración' });
      }

      return res.json({ mensaje: 'Configuración guardada correctamente' });
    }
  );
}

// ========== EXPORTACIÓN ==========
module.exports = {
  obtenerConfiguracion,
  guardarConfiguracion,
};
