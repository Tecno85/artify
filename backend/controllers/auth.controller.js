// ========== DEPENDENCIAS ==========
const bcrypt = require('bcryptjs');

const db = require('../config/db');
const { crearToken } = require('../utils/token');
const {
  normalizarCorreo,
  normalizarDatosUsuario,
  validarCredenciales,
  validarUsuario,
} = require('../utils/validacion');

const MENSAJE_CREDENCIALES_INVALIDAS = 'Credenciales incorrectas';
const CONFIG_DEFECTO = JSON.stringify({
  notificaciones: true,
  formatoDefecto: 'png',
  autoguardado: false,
});

function esErrorDuplicado(error) {
  return error?.code === '23505';
}

// ========== LOGIN DE USUARIO ==========
function login(req, res) {
  const { correo, password } = req.body;
  const correoNormalizado = normalizarCorreo(correo);
  const errorValidacion = validarCredenciales({
    correo: correoNormalizado,
    password,
  });

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }

  console.log('📨 Intento de login recibido');

  // Buscar el usuario por correo para validar sus credenciales
  const query = 'SELECT * FROM USUARIO WHERE LOWER(usr_correo) = ?';

  db.query(query, [correoNormalizado], (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES_INVALIDAS });
    }

    const usuario = results[0];

    if (usuario.usr_estado_usuario !== 'activo') {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES_INVALIDAS });
    }

    // Comparar la contraseña ingresada con el hash almacenado
    const passwordValida = bcrypt.compareSync(password, usuario.usr_contrasena);

    if (!passwordValida) {
      return res.status(401).json({ mensaje: MENSAJE_CREDENCIALES_INVALIDAS });
    }

    const queryAcceso = `
      UPDATE USUARIO
      SET usr_ultimo_acceso = NOW(),
          usr_sesion_activa = true
      WHERE usr_id_usuario = ?
    `;

    // Actualizar el último acceso sin bloquear el login si esta parte falla
    db.query(queryAcceso, [usuario.usr_id_usuario], (errAcceso) => {
      if (errAcceso) {
        console.warn(
          '⚠️ No se pudo actualizar último acceso:',
          errAcceso.message
        );
      }
    });

    const usuarioRespuesta = {
      id: usuario.usr_id_usuario,
      nombres: usuario.usr_nombres,
      apellidos: usuario.usr_apellidos,
      correo: usuario.usr_correo,
      rol: usuario.usr_rol,
    };

    // Entregar un token firmado con el rol real del usuario
    const token = crearToken({
      id: usuario.usr_id_usuario,
      correo: usuario.usr_correo,
      rol: usuario.usr_rol,
      tipo: usuario.usr_rol === 'admin' ? 'admin' : 'usuario',
    });

    return res.json({
      mensaje: 'Login exitoso',
      usuario: usuarioRespuesta,
      token,
    });
  });
}

// ========== REGISTRO DE USUARIO ==========
async function registro(req, res) {
  const {
    nombres: nombresNormalizados,
    apellidos: apellidosNormalizados,
    cedula: cedulaNormalizada,
    fechaNacimiento,
    correo: correoNormalizado,
    password,
  } = normalizarDatosUsuario(req.body);
  const dbPromise = db.promise();
  const errorValidacion = validarUsuario({
    nombres: nombresNormalizados,
    apellidos: apellidosNormalizados,
    cedula: cedulaNormalizada,
    fechaNacimiento,
    correo: correoNormalizado,
    password,
  });

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }

  console.log('📨 Solicitud de registro recibida');

  try {
    await dbPromise.beginTransaction();

    const [usuariosExistentes] = await dbPromise.query(
      'SELECT usr_id_usuario FROM USUARIO WHERE LOWER(usr_correo) = ? OR usr_cedula = ?',
      [correoNormalizado, cedulaNormalizada]
    );

    if (usuariosExistentes.length > 0) {
      await dbPromise.rollback();
      return res
        .status(400)
        .json({ mensaje: 'El correo o cédula ya está registrado' });
    }

    // Encriptar la contraseña antes de persistir el nuevo usuario
    const hash = bcrypt.hashSync(password, 10);

    const [resultadoUsuario] = await dbPromise.query(
      `
        INSERT INTO USUARIO
          (usr_nombres, usr_apellidos, usr_cedula, usr_fecha_nacimiento,
           usr_correo, usr_contrasena, usr_fecha_registro, usr_estado_usuario)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), 'activo')
        RETURNING usr_id_usuario
      `,
      [
        nombresNormalizados,
        apellidosNormalizados,
        cedulaNormalizada,
        fechaNacimiento,
        correoNormalizado,
        hash,
      ]
    );

    const idUsuario = resultadoUsuario.insertId;

    // Crear configuración inicial para que el editor tenga valores por defecto
    await dbPromise.query(
      `
        INSERT INTO CONFIGURACION
          (cfg_usr_id_usuario, cfg_calidad_exportacion, cfg_configuracion_avanzada, cfg_fecha_actualizacion)
        VALUES (?, 'media', ?, NOW())
      `,
      [idUsuario, CONFIG_DEFECTO]
    );

    await dbPromise.commit();

    const usuario = {
      id: idUsuario,
      nombres: nombresNormalizados,
      apellidos: apellidosNormalizados,
      correo: correoNormalizado,
      rol: 'usuario',
    };

    // Devolver token desde el registro para mantener el flujo actual del frontend
    const token = crearToken({
      id: idUsuario,
      correo: correoNormalizado,
      rol: 'usuario',
      tipo: 'usuario',
    });

    return res.json({
      mensaje: 'Registro exitoso',
      usuario,
      token,
    });
  } catch (error) {
    try {
      await dbPromise.rollback();
    } catch {}

    if (esErrorDuplicado(error)) {
      return res
        .status(400)
        .json({ mensaje: 'El correo o cédula ya está registrado' });
    }

    console.error('❌ Error al registrar usuario:', error.message);
    return res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
}

// ========== EXPORTACIÓN ==========
module.exports = {
  login,
  registro,
};
