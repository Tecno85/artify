// ========== DEPENDENCIAS ==========
const db = require('../config/db');
const {
  normalizarIdEntero,
  normalizarPaginacion,
} = require('../utils/validacion');

const TAMANO_MAXIMO_IMAGEN_BYTES = 10 * 1024 * 1024;
const DIMENSION_MAXIMA_IMAGEN_PX = 8192;

function obtenerTotal(results) {
  return Number(results?.[0]?.total ?? 0);
}

// ========== ESTADÍSTICAS DEL USUARIO ==========
function obtenerEstadisticas(req, res) {
  const idUsuario = normalizarIdEntero(req.params.id);

  if (idUsuario === null) {
    return res.status(400).json({ mensaje: 'Identificador de usuario inválido' });
  }

  console.log('📨 Cargando estadísticas de usuario');

  const querySesiones = `
    SELECT COUNT(*)::int as total
    FROM SESION_EDICION
    WHERE ses_usr_id_usuario = ?
  `;

  return db.query(querySesiones, [idUsuario], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener estadísticas:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    const totalSesiones = obtenerTotal(results);

    const queryOperaciones = `
      SELECT COUNT(*)::int as total
      FROM OPERACION
      WHERE opr_usr_id_usuario = ?
    `;

    db.query(queryOperaciones, [idUsuario], (errOperaciones, resOpe) => {
      if (errOperaciones) {
        console.error('❌ Error al obtener operaciones:', errOperaciones.message);
        return res.status(500).json({ mensaje: 'Error en el servidor' });
      }

      const totalOperaciones = obtenerTotal(resOpe);

      const queryImagenes = `
        SELECT COUNT(*)::int as total
        FROM IMAGEN
        WHERE img_usr_id_usuario = ?
      `;

      db.query(queryImagenes, [idUsuario], (errImagenes, resImg) => {
        if (errImagenes) {
          console.error('❌ Error al obtener imágenes:', errImagenes.message);
          return res.status(500).json({ mensaje: 'Error en el servidor' });
        }

        return res.json({
          mensaje: 'ok',
          estadisticas: {
            sesiones: totalSesiones,
            operaciones: totalOperaciones,
            imagenesEditadas: obtenerTotal(resImg),
          },
        });
      });
    });
  });
}

// ========== REGISTRO DE OPERACIONES ==========
async function registrarOperacion(req, res) {
  const { idUsuario, idSesion, tipo, descripcion, parametros } = req.body;
  const idUsuarioNormalizado = normalizarIdEntero(idUsuario);
  const idSesionNormalizado = normalizarIdEntero(idSesion);
  const dbPromise = db.promise();

  if (
    idUsuarioNormalizado === null ||
    idSesionNormalizado === null ||
    typeof tipo !== 'string' ||
    tipo.trim().length === 0 ||
    tipo.trim().length > 100
  ) {
    return res.status(400).json({ mensaje: 'Datos de operación inválidos' });
  }

  try {
    await dbPromise.beginTransaction();

    // Verificar que la sesión usada para registrar la operación pertenezca al usuario
    const [sesiones] = await dbPromise.query(
      `
        SELECT ses_id_sesion, ses_usr_id_usuario, ses_estado_sesion
        FROM SESION_EDICION
        WHERE ses_id_sesion = ?
        FOR UPDATE
      `,
      [idSesionNormalizado]
    );

    if (sesiones.length === 0) {
      await dbPromise.rollback();
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    const sesion = sesiones[0];
    if (sesion.ses_usr_id_usuario !== idUsuarioNormalizado) {
      await dbPromise.rollback();
      return res
        .status(403)
        .json({ mensaje: 'La sesión no pertenece al usuario indicado' });
    }

    if (sesion.ses_estado_sesion !== 'activa') {
      await dbPromise.rollback();
      return res.status(400).json({ mensaje: 'La sesión no está activa' });
    }

    const [ordenes] = await dbPromise.query(
      `
        SELECT COALESCE(MAX(opr_orden_secuencial), 0) + 1 AS siguiente
        FROM OPERACION
        WHERE opr_ses_id_sesion = ?
      `,
      [idSesionNormalizado]
    );
    const siguienteOrden = Number(ordenes[0]?.siguiente || 1);

    const [resultadoOperacion] = await dbPromise.query(
      `
        INSERT INTO OPERACION
          (opr_usr_id_usuario, opr_ses_id_sesion, opr_tipo_operacion,
           opr_parametros, opr_fecha_hora, opr_orden_secuencial, opr_estado_operacion)
        VALUES (?, ?, ?, ?, NOW(), ?, 'completada')
        RETURNING opr_id_operacion
      `,
      [
        idUsuarioNormalizado,
        idSesionNormalizado,
        tipo.trim(),
        JSON.stringify({
          descripcion: typeof descripcion === 'string' ? descripcion.slice(0, 500) : '',
          ...(parametros && typeof parametros === 'object' && !Array.isArray(parametros)
            ? parametros
            : {}),
        }),
        siguienteOrden,
      ]
    );

    // Incrementar el contador de operaciones para la sesión actual
    await dbPromise.query(
      `
        UPDATE SESION_EDICION
        SET ses_numero_operaciones = ses_numero_operaciones + 1
        WHERE ses_id_sesion = ?
      `,
      [idSesionNormalizado]
    );

    await dbPromise.commit();

    return res.json({
      mensaje: 'Operación registrada',
      idOperacion: resultadoOperacion.insertId,
    });
  } catch (error) {
    try {
      await dbPromise.rollback();
    } catch {}

    console.error('❌ Error al registrar operación:', error.message);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// ========== CONSULTAS DE ACTIVIDAD ==========
function obtenerTotalOperaciones(req, res) {
  const idUsuario = normalizarIdEntero(req.params.id);

  if (idUsuario === null) {
    return res.status(400).json({ mensaje: 'Identificador de usuario inválido' });
  }

  const query = `
    SELECT COUNT(*)::int as total
    FROM OPERACION
    WHERE opr_usr_id_usuario = ?
  `;

  return db.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener operaciones:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    return res.json({
      mensaje: 'ok',
      total: obtenerTotal(results),
    });
  });
}

async function obtenerHistorialOperaciones(req, res) {
  const idUsuario = normalizarIdEntero(req.params.id);
  const paginacion = normalizarPaginacion(
    req.query.pagina,
    req.query.limite
  );

  if (idUsuario === null) {
    return res.status(400).json({ mensaje: 'Identificador de usuario inválido' });
  }

  if (paginacion === null) {
    return res.status(400).json({ mensaje: 'Paginación inválida' });
  }

  const dbPromise = db.promise();

  try {
    const [conteo] = await dbPromise.query(
      `
        SELECT COUNT(*)::int AS total
        FROM OPERACION
        WHERE opr_usr_id_usuario = ?
      `,
      [idUsuario]
    );
    const total = obtenerTotal(conteo);

    const [filas] = await dbPromise.query(
      `
        SELECT opr_id_operacion, opr_ses_id_sesion, opr_tipo_operacion,
               opr_parametros, opr_fecha_hora, opr_orden_secuencial,
               opr_estado_operacion
        FROM OPERACION
        WHERE opr_usr_id_usuario = ?
        ORDER BY opr_fecha_hora DESC, opr_id_operacion DESC
        LIMIT ? OFFSET ?
      `,
      [idUsuario, paginacion.limite, paginacion.offset]
    );

    const totalPaginas = Math.ceil(total / paginacion.limite);
    const operaciones = filas.map((fila) => ({
      id: fila.opr_id_operacion,
      idSesion: fila.opr_ses_id_sesion,
      tipo: fila.opr_tipo_operacion,
      descripcion:
        fila.opr_parametros &&
        typeof fila.opr_parametros === 'object' &&
        typeof fila.opr_parametros.descripcion === 'string'
          ? fila.opr_parametros.descripcion
          : '',
      parametros: fila.opr_parametros,
      fecha: fila.opr_fecha_hora,
      orden: fila.opr_orden_secuencial,
      estado: fila.opr_estado_operacion,
    }));

    return res.json({
      mensaje: 'ok',
      operaciones,
      paginacion: {
        pagina: paginacion.pagina,
        limite: paginacion.limite,
        total,
        totalPaginas,
        tieneAnterior: paginacion.pagina > 1,
        tieneSiguiente: paginacion.pagina < totalPaginas,
      },
    });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error.message);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// ========== REGISTRO DE IMÁGENES ==========
async function registrarImagen(req, res) {
  const {
    idUsuario,
    idSesion,
    nombreOriginal,
    formatoOriginal,
    formatoFinal,
    tamanoOriginal,
    anchoOriginal,
    altoOriginal,
  } = req.body;
  const idUsuarioNormalizado = normalizarIdEntero(idUsuario);
  const idSesionNormalizado = normalizarIdEntero(idSesion);
  const formato = String(formatoFinal || formatoOriginal || '')
    .trim()
    .toLowerCase()
    .replace(/^jpg$/, 'jpeg');
  const tamano = Number(tamanoOriginal);
  const ancho = Number(anchoOriginal);
  const alto = Number(altoOriginal);
  const dbPromise = db.promise();

  if (
    idUsuarioNormalizado === null ||
    idSesionNormalizado === null ||
    typeof nombreOriginal !== 'string' ||
    nombreOriginal.trim().length === 0 ||
    nombreOriginal.trim().length > 255 ||
    !['png', 'jpeg', 'webp'].includes(formato) ||
    !Number.isSafeInteger(tamano) ||
    tamano <= 0 ||
    tamano > TAMANO_MAXIMO_IMAGEN_BYTES ||
    !Number.isSafeInteger(ancho) ||
    ancho <= 0 ||
    ancho > DIMENSION_MAXIMA_IMAGEN_PX ||
    !Number.isSafeInteger(alto) ||
    alto <= 0 ||
    alto > DIMENSION_MAXIMA_IMAGEN_PX
  ) {
    return res.status(400).json({ mensaje: 'Datos de imagen inválidos' });
  }

  console.log('📨 Registrando imagen editada');

  try {
    await dbPromise.beginTransaction();

    const [sesiones] = await dbPromise.query(
      `
        SELECT ses_id_sesion, ses_usr_id_usuario, ses_estado_sesion
        FROM SESION_EDICION
        WHERE ses_id_sesion = ?
        FOR UPDATE
      `,
      [idSesionNormalizado]
    );

    const sesion = sesiones[0];
    if (!sesion) {
      await dbPromise.rollback();
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    if (sesion.ses_usr_id_usuario !== idUsuarioNormalizado) {
      await dbPromise.rollback();
      return res
        .status(403)
        .json({ mensaje: 'La sesión no pertenece al usuario indicado' });
    }

    if (sesion.ses_estado_sesion !== 'activa') {
      await dbPromise.rollback();
      return res.status(400).json({ mensaje: 'La sesión no está activa' });
    }

    const [resultado] = await dbPromise.query(
      `
        INSERT INTO IMAGEN
          (img_usr_id_usuario, img_nombre_original, img_nombre_archivo,
           img_formato, img_ancho_original, img_alto_original,
           img_tamano_bytes, img_fecha_subida, img_fecha_modificacion, img_estado_imagen)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'activa')
        RETURNING img_id_imagen
      `,
      [
        idUsuarioNormalizado,
        nombreOriginal.trim(),
        nombreOriginal.trim(),
        formato,
        ancho,
        alto,
        tamano,
      ]
    );

    await dbPromise.query(
      `
        UPDATE SESION_EDICION
        SET ses_img_id_imagen = ?,
            ses_cambios_guardados = true
        WHERE ses_id_sesion = ?
      `,
      [resultado.insertId, idSesionNormalizado]
    );

    await dbPromise.commit();

    return res.json({
      mensaje: 'Imagen registrada',
      idImagen: resultado.insertId,
    });
  } catch (error) {
    try {
      await dbPromise.rollback();
    } catch {}

    console.error('❌ Error al registrar imagen:', error.message);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
}

// ========== EXPORTACIÓN ==========
module.exports = {
  obtenerEstadisticas,
  obtenerHistorialOperaciones,
  registrarOperacion,
  obtenerTotalOperaciones,
  registrarImagen,
};
