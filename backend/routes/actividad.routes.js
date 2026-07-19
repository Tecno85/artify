// ========== DEPENDENCIAS ==========
const express = require('express');

const {
  obtenerEstadisticas,
  registrarOperacion,
  obtenerTotalOperaciones,
  registrarImagen,
} = require('../controllers/actividad.controller');
const {
  autenticarToken,
  autorizarUsuarioPorParametro,
  autorizarUsuarioPorBody,
} = require('../middlewares/auth');

const router = express.Router();

// ========== RUTAS PROTEGIDAS DE ACTIVIDAD ==========
router.get(
  '/estadisticas/:id',
  autenticarToken,
  autorizarUsuarioPorParametro('id'),
  obtenerEstadisticas
);
router.get(
  '/operacion/total/:id',
  autenticarToken,
  autorizarUsuarioPorParametro('id'),
  obtenerTotalOperaciones
);
router.post(
  '/operacion',
  autenticarToken,
  autorizarUsuarioPorBody('idUsuario'),
  registrarOperacion
);
router.post(
  '/imagen',
  autenticarToken,
  autorizarUsuarioPorBody('idUsuario'),
  registrarImagen
);

// ========== EXPORTACIÓN ==========
module.exports = router;
