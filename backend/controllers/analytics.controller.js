// ========== DEPENDENCIAS ==========
const db = require('../config/db');

// ========== ANALYTICS: FILTROS ==========
function filtrosPopulares(req, res) {
  const query = `
    SELECT
      opr_tipo_operacion as filtro,
      COUNT(*)::int as usos,
      COALESCE(
        ROUND(
          100.0 * COUNT(*) / NULLIF(
            (SELECT COUNT(*) FROM OPERACION WHERE opr_estado_operacion = 'completada'),
            0
          ),
          2
        ),
        0
      )::float as porcentaje
    FROM OPERACION
    WHERE opr_estado_operacion = 'completada'
    GROUP BY opr_tipo_operacion
    ORDER BY usos DESC
    LIMIT 10
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo filtros:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error obteniendo datos',
        error: err.message,
      });
    }

    return res.json({
      ok: true,
      mensaje: 'Top filtros utilizados',
      data: { filtros: results },
      meta: {
        timestamp: new Date().toISOString(),
        totalFiltros: results.length,
      },
    });
  });
}

// ========== ANALYTICS: HORARIOS ==========
function horariosEdicion(req, res) {
  const query = `
    SELECT
      EXTRACT(HOUR FROM opr_fecha_hora)::int as hora,
      COUNT(*)::int as cantidad_ediciones,
      COALESCE(
        ROUND(
          100.0 * COUNT(*) / NULLIF(
            (SELECT COUNT(*) FROM OPERACION WHERE opr_estado_operacion = 'completada'),
            0
          ),
          2
        ),
        0
      )::float as porcentaje
    FROM OPERACION
    WHERE opr_estado_operacion = 'completada'
    GROUP BY EXTRACT(HOUR FROM opr_fecha_hora)
    ORDER BY cantidad_ediciones DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo horarios:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error obteniendo datos',
        error: err.message,
      });
    }

    return res.json({
      ok: true,
      mensaje: 'Horarios pico de edición',
      data: { horarios: results },
      meta: {
        timestamp: new Date().toISOString(),
        totalHoras: results.length,
      },
    });
  });
}

// ========== ANALYTICS: FORMATOS ==========
function formatosPreferidos(req, res) {
  const query = `
    SELECT
      img_formato as formato,
      COUNT(*)::int as descargas,
      COALESCE(
        ROUND(
          100.0 * COUNT(*) / NULLIF(
            (SELECT COUNT(*) FROM IMAGEN WHERE img_estado_imagen = 'activa'),
            0
          ),
          2
        ),
        0
      )::float as porcentaje
    FROM IMAGEN
    WHERE img_estado_imagen = 'activa'
    GROUP BY img_formato
    ORDER BY descargas DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo formatos:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error obteniendo datos',
        error: err.message,
      });
    }

    return res.json({
      ok: true,
      mensaje: 'Formatos más descargados',
      data: { formatos: results },
      meta: {
        timestamp: new Date().toISOString(),
        totalFormatos: results.length,
      },
    });
  });
}

// ========== ANALYTICS: CONVERSIÓN ==========
function tasaConversion(req, res) {
  const query = `
    SELECT
      COALESCE(
        ROUND(
          100.0 * SUM(CASE WHEN ses_cambios_guardados = true THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
          2
        ),
        0
      )::float as tasa_conversion_porcentaje,
      COUNT(*)::int as total_sesiones,
      COALESCE(SUM(CASE WHEN ses_cambios_guardados = true THEN 1 ELSE 0 END), 0)::int as sesiones_exitosas
    FROM SESION_EDICION
    WHERE ses_estado_sesion = 'finalizada'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error obteniendo tasa de conversión:', err.message);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error obteniendo datos',
        error: err.message,
      });
    }

    return res.json({
      ok: true,
      mensaje: 'Tasa de conversión de sesiones',
      data: { conversionData: results[0] },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });
}

// ========== EXPORTACIÓN ==========
module.exports = {
  filtrosPopulares,
  horariosEdicion,
  formatosPreferidos,
  tasaConversion,
};
