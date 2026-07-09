// ========== DEPENDENCIAS ==========
const db = require('../config/db');
const { normalizarIdEntero } = require('../utils/validacion');

// ========== SESIONES DE EDICIÓN ==========
async function iniciarSesionEdicion(req, res) {
  const idUsuario = normalizarIdEntero(req.body?.idUsuario);
  const dbPromise = db.promise();

  if (idUsuario === null) {
    return res.status(400).json({ mensaje: 'Datos de sesión inválidos' });
  }

  console.log('📨 Iniciando sesión de edición');

  try {
    await dbPromise.beginTransaction();

    const [resultado] = await dbPromise.query(
      `
        INSERT INTO SESION_EDICION
          (ses_usr_id_usuario, ses_fecha_inicio, ses_estado_sesion)
        VALUES (?, NOW(), 'activa')
        RETURNING ses_id_sesion
      `,
      [idUsuario]
    );

    await dbPromise.query(
      `
        UPDATE USUARIO
        SET usr_sesion_activa = true
        WHERE usr_id_usuario = ?
      `,
      [idUsuario]
    );

    await dbPromise.commit();

    return res.json({
      mensaje: 'Sesión iniciada',
      idSesion: resultado.insertId,
    });
  } catch (error) {
    try {
      await dbPromise.rollback();
    } catch {}

    console.error('❌ Error al iniciar sesión:', error.message);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

async function cerrarSesionEdicion(req, res) {
  const idSesion = normalizarIdEntero(req.body?.idSesion);
  const dbPromise = db.promise();

  if (idSesion === null) {
    return res.status(400).json({ mensaje: 'Datos de sesión inválidos' });
  }

  console.log('📨 Cerrando sesión de edición');

  try {
    await dbPromise.beginTransaction();

    const [sesiones] = await dbPromise.query(
      `
        SELECT ses_id_sesion, ses_usr_id_usuario
        FROM SESION_EDICION
        WHERE ses_id_sesion = ?
      `,
      [idSesion]
    );

    if (sesiones.length === 0) {
      await dbPromise.rollback();
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    const sesion = sesiones[0];
    const puedeCerrar =
      req.auth?.rol === 'admin' || req.auth?.id === sesion.ses_usr_id_usuario;

    if (!puedeCerrar) {
      await dbPromise.rollback();
      return res
        .status(403)
        .json({ mensaje: 'No puedes cerrar sesiones de otro usuario' });
    }

    await dbPromise.query(
      `
        UPDATE SESION_EDICION
        SET ses_fecha_fin = COALESCE(ses_fecha_fin, NOW()),
            ses_duracion_minutos = GREATEST(
              0,
              FLOOR(EXTRACT(EPOCH FROM (COALESCE(ses_fecha_fin, NOW()) - ses_fecha_inicio)) / 60)::int
            ),
            ses_estado_sesion = 'finalizada'
        WHERE ses_id_sesion = ?
      `,
      [idSesion]
    );

    await dbPromise.query(
      `
        UPDATE USUARIO
        SET usr_sesion_activa = EXISTS (
          SELECT 1
          FROM SESION_EDICION
          WHERE ses_usr_id_usuario = ?
            AND ses_estado_sesion = 'activa'
        )
        WHERE usr_id_usuario = ?
      `,
      [sesion.ses_usr_id_usuario, sesion.ses_usr_id_usuario]
    );

    await dbPromise.commit();
    return res.json({ mensaje: 'Sesión cerrada' });
  } catch (error) {
    try {
      await dbPromise.rollback();
    } catch {}

    console.error('❌ Error al cerrar sesión:', error.message);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// ========== EXPORTACIÓN ==========
module.exports = {
  iniciarSesionEdicion,
  cerrarSesionEdicion,
};
