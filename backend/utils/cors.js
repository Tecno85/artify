function normalizarOrigenesCors(valor) {
  return (valor || '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
}

function obtenerOrigenesPermitidos() {
  const origenes = normalizarOrigenesCors(process.env.CORS_ORIGIN);

  if (process.env.NODE_ENV === 'production' && origenes.length === 0) {
    throw new Error(
      'CORS_ORIGIN debe contener al menos un origen autorizado en producción'
    );
  }

  return origenes;
}

module.exports = {
  normalizarOrigenesCors,
  obtenerOrigenesPermitidos,
};
