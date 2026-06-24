// ========== DEPENDENCIAS ==========
const express = require('express');

const {
  filtrosPopulares,
  horariosEdicion,
  formatosPreferidos,
  tasaConversion,
} = require('../controllers/analytics.controller');

const router = express.Router();

// ========== RUTAS PÚBLICAS DE ANALYTICS ==========
router.get('/v1/analytics/filtros-populares', filtrosPopulares);
router.get('/v1/analytics/horarios-edicion', horariosEdicion);
router.get('/v1/analytics/formatos-preferidos', formatosPreferidos);
router.get('/v1/analytics/tasa-conversion', tasaConversion);

// ========== EXPORTACIÓN ==========
module.exports = router;
