const db = require('../config/db');
const { verificarToken } = require('../utils/token');
const { normalizarIdEntero } = require('../utils/validacion');

function responder401(res, mensaje = 'Token ausente, inválido o expirado') {
  return res.status(401).json({ mensaje });
}

function responder403(res, mensaje = 'No tienes permisos para esta acción') {
  return res.status(403).json({ mensaje });
}

function extraerToken(req) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim();
}

function autenticarToken(req, res, next) {
  const token = extraerToken(req);

  if (!token) {
    return responder401(res);
  }

  try {
    req.auth = verificarToken(token);
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRADO') {
      return responder401(res, 'Token expirado');
    }

    return responder401(res);
  }

  const idUsuario = normalizarIdEntero(req.auth?.id);
  if (idUsuario === null) {
    return responder401(res);
  }

  const query = `
    SELECT usr_id_usuario, usr_correo, usr_rol, usr_estado_usuario
    FROM USUARIO
    WHERE usr_id_usuario = ?
  `;

  return db.query(query, [idUsuario], (error, usuarios) => {
    if (error) {
      console.error('❌ Error al validar la cuenta autenticada:', error.message);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    const usuario = usuarios[0];
    if (!usuario || usuario.usr_estado_usuario !== 'activo') {
      return responder401(res);
    }

    req.auth = {
      ...req.auth,
      id: usuario.usr_id_usuario,
      correo: usuario.usr_correo,
      rol: usuario.usr_rol,
      tipo: usuario.usr_rol === 'admin' ? 'admin' : 'usuario',
    };

    return next();
  });
}

function requiereAdmin(req, res, next) {
  if (req.auth?.rol !== 'admin') {
    return responder403(res, 'Se requieren permisos de administrador');
  }

  return next();
}

function autorizarUsuarioPorParametro(nombreParametro = 'id') {
  return (req, res, next) => {
    if (req.auth?.rol === 'admin') {
      return next();
    }

    const valor = normalizarIdEntero(req.params[nombreParametro]);

    if (valor === null || valor !== req.auth?.id) {
      return responder403(res, 'No puedes acceder a recursos de otro usuario');
    }

    return next();
  };
}

function autorizarUsuarioPorBody(nombreCampo = 'idUsuario') {
  return (req, res, next) => {
    if (req.auth?.rol === 'admin') {
      return next();
    }

    const valor = normalizarIdEntero(req.body?.[nombreCampo]);

    if (valor === null || valor !== req.auth?.id) {
      return responder403(res, 'No puedes modificar recursos de otro usuario');
    }

    return next();
  };
}

module.exports = {
  autenticarToken,
  requiereAdmin,
  autorizarUsuarioPorParametro,
  autorizarUsuarioPorBody,
  responder401,
  responder403,
};
