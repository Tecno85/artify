// ========== LIMITADOR SIMPLE DE INTENTOS FALLIDOS ==========
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
    let registro = intentos.get(clave);

    if (registro?.expira <= ahora) {
      intentos.delete(clave);
      registro = null;
    }

    if (registro?.total >= maxIntentos) {
      return res.status(429).json({ mensaje });
    }

    res.on('finish', () => {
      if (res.statusCode === 401) {
        const vigente = intentos.get(clave);

        if (!vigente || vigente.expira <= Date.now()) {
          intentos.set(clave, { total: 1, expira: Date.now() + ventanaMs });
        } else {
          vigente.total += 1;
        }
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        intentos.delete(clave);
      }

      if (intentos.size > 1000) {
        const momentoLimpieza = Date.now();
        for (const [key, value] of intentos.entries()) {
          if (value.expira <= momentoLimpieza) {
            intentos.delete(key);
          }
        }
      }
    });

    return next();
  };
}

module.exports = {
  limitarIntentos,
};
