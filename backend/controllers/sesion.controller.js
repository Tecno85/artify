// ========== DEPENDENCIAS ==========
const db = require('../config/db');
const { normalizarIdEntero } = require('../utils/validacion');

// ========== SESIONES DE EDICIÓN ==========
function iniciarSesionEdicion(req, res) {
  const { idUsuario } = req.body;
  const idUsuarioNormalizado = normalizarIdEntero(idUsuario);

  if (idUsuarioNormalizado === null) {
    return res.status(400).json({ mensaje: 'Datos de sesión inválidos' });
  }

  console.log('📨 Iniciando sesión de edición');

  const query = `
    INSERT INTO SESION_EDICION
      (ses_usr_id_usuario, ses_fecha_inicio, ses_estado_sesion)
    VALUES (?, NOW(), 'activa')
    RETURNING ses_id_sesion
  `;

  db.query(query, [idUsuarioNormalizado], (err, result) => {
    if (err) {
      console.error('❌ Error al iniciar sesión:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    return res.json({
      mensaje: 'Sesión iniciada',
      idSesion: result.insertId,
    });
  });
}

function cerrarSesionEdicion(req, res) {
  const idSesion = normalizarIdEntero(req.body?.idSesion);

  if (idSesion === null) {
    return res.status(400).json({ mensaje: 'Datos de sesión inválidos' });
  }

  console.log('📨 Cerrando sesión de edición');

  const queryValidar = `
    SELECT ses_id_sesion, ses_usr_id_usuario
    FROM SESION_EDICION
    WHERE ses_id_sesion = ?
  `;

  db.query(queryValidar, [idSesion], (errValidar, results) => {
    if (errValidar) {
      console.error('❌ Error al validar sesión:', errValidar.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    const sesion = results[0];

    // Permitir el cierre solo al dueño de la sesión o a un administrador
    const puedeCerrar =
      req.auth?.rol === 'admin' || req.auth?.id === sesion.ses_usr_id_usuario;

    if (!puedeCerrar) {
      return res
        .status(403)
        .json({ mensaje: 'No puedes cerrar sesiones de otro usuario' });
    }

    // Cerrar la sesión y reflejar el cambio en el estado del usuario
    const query = `
      UPDATE SESION_EDICION
      SET ses_fecha_fin = NOW(),
          ses_estado_sesion = 'finalizada'
      WHERE ses_id_sesion = ?
    `;

    db.query(query, [idSesion], (errCerrar) => {
      if (errCerrar) {
        console.error('❌ Error al cerrar sesión:', errCerrar.message);
        return res.status(500).json({ mensaje: 'Error en el servidor' });
      }

      const queryInactiva = `
        UPDATE USUARIO u
        SET usr_sesion_activa = false
        FROM SESION_EDICION s
        WHERE s.ses_id_sesion = ?
        AND u.usr_id_usuario = s.ses_usr_id_usuario
      `;

      db.query(queryInactiva, [idSesion], (errInactiva) => {
        if (errInactiva) {
          console.warn(
            '⚠️ No se pudo actualizar sesión activa:',
            errInactiva.message
          );
        }

        return res.json({ mensaje: 'Sesión cerrada' });
      });
    });
  });
}

// ========== EXPORTACIÓN ==========
module.exports = {
  iniciarSesionEdicion,
  cerrarSesionEdicion,
};
