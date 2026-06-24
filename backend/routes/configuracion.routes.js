// ========== DEPENDENCIAS ==========
const express = require('express');

const {
  obtenerConfiguracion,
  guardarConfiguracion,
} = require('../controllers/configuracion.controller');
const {
  autenticarToken,
  autorizarUsuarioPorParametro,
  autorizarUsuarioPorBody,
} = require('../middlewares/auth');

const router = express.Router();

// ========== RUTAS PROTEGIDAS DE CONFIGURACIÓN ==========
router.get(
  '/configuracion/:id',
  autenticarToken,
  autorizarUsuarioPorParametro('id'),
  obtenerConfiguracion
);
router.post(
  '/configuracion',
  autenticarToken,
  autorizarUsuarioPorBody('idUsuario'),
  guardarConfiguracion
);

// ========== EXPORTACIÓN ==========
module.exports = router;
