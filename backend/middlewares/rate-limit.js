// ========== LIMITADOR SIMPLE DE INTENTOS ==========
function limitarIntentos({
  ventanaMs = 15 * 60 * 1000,
  maxIntentos = 10,
  mensaje = 'Demasiados intentos. Intenta nuevamente más tarde',
} = {}) {
  const intentos = new Map();

  return (req, res, next) => {
    const ahora = Date.now();
    const correo = String(req.body?.correo || '').trim().toLowerCase();
    const clave = `${req.ip}:${req.originalUrl}:${correo}`;
    const registro = intentos.get(clave);

    if (!registro || registro.expira <= ahora) {
      intentos.set(clave, { total: 1, expira: ahora + ventanaMs });
      return next();
    }

    registro.total += 1;

    if (registro.total > maxIntentos) {
      return res.status(429).json({ mensaje });
    }

    if (intentos.size > 1000) {
      for (const [key, value] of intentos.entries()) {
        if (value.expira <= ahora) {
          intentos.delete(key);
        }
      }
    }

    return next();
  };
}

module.exports = {
  limitarIntentos,
};
