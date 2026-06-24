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
    return next();
  } catch (error) {
    if (error.message === 'TOKEN_EXPIRADO') {
      return responder401(res, 'Token expirado');
    }

    return responder401(res);
  }
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
