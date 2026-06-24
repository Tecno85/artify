// ========== DEPENDENCIAS ==========
const express = require('express');

const {
  listarUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
} = require('../controllers/admin.controller');
const { autenticarToken, requiereAdmin } = require('../middlewares/auth');

const router = express.Router();

// Proteger todo el prefijo /admin con autenticación y rol administrador
router.use('/admin', autenticarToken, requiereAdmin);

// ========== RUTAS PROTEGIDAS DE ADMINISTRACIÓN ==========
router.get('/admin/usuarios', listarUsuarios);
router.post('/admin/usuario', crearUsuario);
router.put('/admin/usuario/:id', editarUsuario);
router.delete('/admin/usuario/:id', eliminarUsuario);

// ========== EXPORTACIÓN ==========
module.exports = router;
