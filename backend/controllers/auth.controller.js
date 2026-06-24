// ========== DEPENDENCIAS ==========
const bcrypt = require('bcryptjs');

const db = require('../config/db');
const { crearToken } = require('../utils/token');
const {
  validarCredenciales,
  validarCredencialesAdmin,
  validarUsuario,
} = require('../utils/validacion');

// ========== LOGIN DE USUARIO ==========
function login(req, res) {
  const { correo, password } = req.body;
  const errorValidacion = validarCredenciales({ correo, password });

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }

  console.log('📨 Intento de login recibido');

  // Buscar el usuario por correo para validar sus credenciales
  const query = 'SELECT * FROM USUARIO WHERE usr_correo = ?';

  db.query(query, [correo], (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = results[0];

    // Comparar la contraseña ingresada con el hash almacenado
    const passwordValida = bcrypt.compareSync(password, usuario.usr_contrasena);

    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
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
function registro(req, res) {
  const { nombres, apellidos, cedula, fechaNacimiento, correo, password } =
    req.body;
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

  console.log('📨 Solicitud de registro recibida');

  const queryBuscar =
    'SELECT * FROM USUARIO WHERE usr_correo = ? OR usr_cedula = ?';

  db.query(queryBuscar, [correo, cedula], (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta:', err.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length > 0) {
      return res
        .status(400)
        .json({ mensaje: 'El correo o cédula ya está registrado' });
    }

    // Encriptar la contraseña antes de persistir el nuevo usuario
    const hash = bcrypt.hashSync(password, 10);

    const queryInsertar = `
      INSERT INTO USUARIO
        (usr_nombres, usr_apellidos, usr_cedula, usr_fecha_nacimiento,
         usr_correo, usr_contrasena, usr_fecha_registro, usr_estado_usuario)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), 'activo')
      RETURNING usr_id_usuario
    `;

    db.query(
      queryInsertar,
      [nombres, apellidos, cedula, fechaNacimiento, correo, hash],
      (errInsertar, result) => {
        if (errInsertar) {
          console.error('❌ Error al insertar usuario:', errInsertar.message);
          return res
            .status(500)
            .json({ mensaje: 'Error al registrar usuario' });
        }

        // Crear configuración inicial para que el editor tenga valores por defecto
        const queryConfig = `
          INSERT INTO CONFIGURACION
            (cfg_usr_id_usuario, cfg_calidad_exportacion, cfg_configuracion_avanzada, cfg_fecha_actualizacion)
          VALUES (?, 'media', ?, NOW())
        `;

        const configDefecto = JSON.stringify({
          notificaciones: true,
          formatoDefecto: 'png',
          autoguardado: false,
        });

        db.query(queryConfig, [result.insertId, configDefecto], (errConfig) => {
          if (errConfig) {
            console.warn(
              '⚠️ No se pudo crear configuración por defecto:',
              errConfig.message
            );
          }

          const usuario = {
            id: result.insertId,
            nombres,
            apellidos,
            correo,
            rol: 'usuario',
          };

          // Devolver token desde el registro para mantener el flujo actual del frontend
          const token = crearToken({
            id: result.insertId,
            correo,
            rol: 'usuario',
            tipo: 'usuario',
          });

          return res.json({
            mensaje: 'Registro exitoso',
            usuario,
            token,
          });
        });
      }
    );
  });
}

// ========== LOGIN DE ADMINISTRADOR ==========
function loginAdmin(req, res) {
  const { correo, password } = req.body;
  const errorValidacion = validarCredencialesAdmin({ correo, password });

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
  }

  console.log('📨 Intento de acceso al panel de administración recibido');

  if (
    correo !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
  }

  const admin = { correo, rol: 'admin' };

  // Crear token administrativo para las rutas protegidas del panel
  const token = crearToken({
    id: 0,
    correo,
    rol: 'admin',
    tipo: 'admin',
  });

  return res.json({ mensaje: 'Acceso concedido', admin, token });
}

// ========== EXPORTACIÓN ==========
module.exports = {
  login,
  registro,
  loginAdmin,
};
