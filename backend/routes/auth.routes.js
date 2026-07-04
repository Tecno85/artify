// ========== DEPENDENCIAS ==========
const express = require('express');

const { login, registro } = require('../controllers/auth.controller');
const { limitarIntentos } = require('../middlewares/rate-limit');

const router = express.Router();
const limitarLogin = limitarIntentos();

// ========== RUTAS PÚBLICAS DE AUTENTICACIÓN ==========
router.post('/login', limitarLogin, login);
router.post('/registro', registro);

// ========== EXPORTACIÓN ==========
module.exports = router;
