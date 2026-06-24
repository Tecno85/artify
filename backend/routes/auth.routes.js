// ========== DEPENDENCIAS ==========
const express = require('express');

const {
  login,
  registro,
  loginAdmin,
} = require('../controllers/auth.controller');

const router = express.Router();

// ========== RUTAS PÚBLICAS DE AUTENTICACIÓN ==========
router.post('/login', login);
router.post('/registro', registro);
router.post('/admin/login', loginAdmin);

// ========== EXPORTACIÓN ==========
module.exports = router;
