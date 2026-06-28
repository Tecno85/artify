// ========== DEPENDENCIAS ==========
const bcrypt = require('bcryptjs');

const db = require('../config/db');
const {
  normalizarIdEntero,
  validarUsuario,
  validarEdicionUsuario,
} = require('../utils/validacion');

const CONFIG_DEFECTO = JSON.stringify({
  notificaciones: true,
  formatoDefecto: 'png',
  autoguardado: false,
});

function esErrorDuplicado(error) {
  return error?.code === '23505';
}

// ========== CONSULTAS DEL PANEL ADMIN ==========
function listarUsuarios(req, res) {
  const query = `
    SELECT usr_id_usuario, usr_nombres, usr_apellidos,
           usr_cedula, usr_fecha_nacimiento, usr_correo,
           usr_fecha_registro, usr_estado_usuario, usr_rol
    FROM USUARIO
    ORDER BY usr_fecha_registro DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error al obtener usuarios:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    return res.json({ mensaje: 'ok', usuarios: results });
  });
}

// ========== CREACIÓN DE USUARIO ==========
async function crearUsuario(req, res) {
  const { nombres, apellidos, cedula, fechaNacimiento, correo, password } =
    req.body;
  const dbPromise = db.promise();
  const errorValidacion = validarUsuario({
    nombres,
    apellidos,
    cedula,
    fechaNacimiento,
    correo,
    password,
  });

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }

  try {
    await dbPromise.beginTransaction();

    const [usuariosExistentes] = await dbPromise.query(
      'SELECT usr_id_usuario FROM USUARIO WHERE usr_correo = ? OR usr_cedula = ?',
      [correo, cedula]
    );

    if (usuariosExistentes.length > 0) {
      await dbPromise.rollback();
      return res
        .status(400)
        .json({ mensaje: 'El correo o cédula ya está registrado' });
    }

    // Encriptar la contraseña para mantener el mismo criterio del registro público
    const hash = bcrypt.hashSync(password, 10);

    const [resultadoUsuario] = await dbPromise.query(
      `
        INSERT INTO USUARIO
          (usr_nombres, usr_apellidos, usr_cedula, usr_fecha_nacimiento,
           usr_correo, usr_contrasena, usr_fecha_registro, usr_estado_usuario)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), 'activo')
        RETURNING usr_id_usuario
      `,
      [nombres, apellidos, cedula, fechaNacimiento, correo, hash]
    );

    // Crear configuración inicial para el usuario generado desde el panel
    await dbPromise.query(
      `INSERT INTO CONFIGURACION (cfg_usr_id_usuario, cfg_calidad_exportacion, cfg_configuracion_avanzada, cfg_fecha_actualizacion) VALUES (?, 'media', ?, NOW())`,
      [resultadoUsuario.insertId, CONFIG_DEFECTO]
    );

    await dbPromise.commit();
    return res.json({ mensaje: 'Usuario agregado correctamente' });
  } catch (error) {
    try {
      await dbPromise.rollback();
    } catch {}

    if (esErrorDuplicado(error)) {
      return res
        .status(400)
        .json({ mensaje: 'El correo o cédula ya está registrado' });
    }

    console.error('❌ Error al agregar usuario:', error.message);
    return res.status(500).json({ mensaje: 'Error al agregar usuario' });
  }
}

// ========== EDICIÓN DE USUARIO ==========
function editarUsuario(req, res) {
  const id = normalizarIdEntero(req.params.id);
  const { nombres, apellidos, cedula, fechaNacimiento, correo, estado } =
    req.body;

  if (id === null) {
    return res.status(400).json({ mensaje: 'Identificador de usuario inválido' });
  }

  const errorValidacion = validarEdicionUsuario({
    nombres,
    apellidos,
    cedula,
    fechaNacimiento,
    correo,
    estado,
  });

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }

  const query = `
    UPDATE USUARIO
    SET usr_nombres = ?,
        usr_apellidos = ?,
        usr_cedula = ?,
        usr_fecha_nacimiento = ?,
        usr_correo = ?,
        usr_estado_usuario = ?
    WHERE usr_id_usuario = ?
  `;

  db.query(
    query,
    [nombres, apellidos, cedula, fechaNacimiento, correo, estado, id],
    (err, result) => {
      if (err) {
        console.error('❌ Error al editar usuario:', err.message);
        if (esErrorDuplicado(err)) {
          return res
            .status(400)
            .json({ mensaje: 'El correo o cédula ya está registrado' });
        }

        return res.status(500).json({ mensaje: 'Error al editar usuario' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      return res.json({ mensaje: 'Usuario editado correctamente' });
    }
  );
}

// ========== ELIMINACIÓN DE USUARIO ==========
async function eliminarUsuario(req, res) {
  const id = normalizarIdEntero(req.params.id);
  const dbPromise = db.promise();

  if (id === null) {
    return res.status(400).json({ mensaje: 'Identificador de usuario inválido' });
  }

  // Eliminar primero las tablas más dependientes para evitar errores de integridad referencial
  const pasos = [
    {
      nombre: 'OPERACION',
      query: 'DELETE FROM OPERACION WHERE opr_usr_id_usuario = ?',
    },
    {
      nombre: 'SESION_EDICION',
      query: 'DELETE FROM SESION_EDICION WHERE ses_usr_id_usuario = ?',
    },
    {
      nombre: 'IMAGEN',
      query: 'DELETE FROM IMAGEN WHERE img_usr_id_usuario = ?',
    },
    {
      nombre: 'CONFIGURACION',
      query: 'DELETE FROM CONFIGURACION WHERE cfg_usr_id_usuario = ?',
    },
    {
      nombre: 'USUARIO',
      query: 'DELETE FROM USUARIO WHERE usr_id_usuario = ?',
    },
  ];

  try {
    // Confirmar la existencia del usuario antes de abrir la transacción
    const [usuarios] = await dbPromise.query(
      'SELECT usr_id_usuario FROM USUARIO WHERE usr_id_usuario = ?',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Ejecutar todos los borrados como una sola unidad de trabajo
    await dbPromise.beginTransaction();

    for (const paso of pasos) {
      try {
        const [resultado] = await dbPromise.query(paso.query, [id]);

        // Validar que la eliminación final sí haya afectado al usuario principal
        if (paso.nombre === 'USUARIO' && resultado.affectedRows === 0) {
          throw new Error('USUARIO_NO_ENCONTRADO');
        }
      } catch (error) {
        console.error(
          `❌ Error al eliminar usuario ID ${id} en paso ${paso.nombre}:`,
          error.message
        );
        throw error;
      }
    }

    // Confirmar la transacción solo cuando todos los pasos terminan correctamente
    await dbPromise.commit();
    return res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    try {
      await dbPromise.rollback();
    } catch {}

    if (error.message === 'USUARIO_NO_ENCONTRADO') {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    return res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
}

// ========== EXPORTACIÓN ==========
module.exports = {
  listarUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
};
