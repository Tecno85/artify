// ========== UTILIDADES DE CONFIGURACIÓN ==========
// Convertir la configuración avanzada a objeto sin romper el flujo si viene vacía o inválida
function parsearConfiguracionAvanzada(valor) {
  if (!valor) {
    return {};
  }

  if (typeof valor === 'object') {
    return valor;
  }

  try {
    return JSON.parse(valor);
  } catch {
    return {};
  }
}

// ========== EXPORTACIÓN ==========
module.exports = {
  parsearConfiguracionAvanzada,
};
