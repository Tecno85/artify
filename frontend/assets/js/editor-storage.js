window.ArtifyEditorStorage = (() => {
  const RESPALDO_LOCAL_KEY = 'artify_backup_v1';
  const RESPALDO_EXPIRACION_MS = 7 * 24 * 60 * 60 * 1000;
  const RESPALDO_LEGACY_KEYS = [
    'artify_backup_image',
    'artify_backup_timestamp',
  ];

  function eliminarRespaldoLocal() {
    [RESPALDO_LOCAL_KEY, ...RESPALDO_LEGACY_KEYS].forEach((clave) => {
      try {
        localStorage.removeItem(clave);
      } catch {}
    });
  }

  function guardarRespaldoLocal({
    dataUrl,
    formato,
    nombreOriginal,
    tamanoBytes,
  }) {
    try {
      const usuario = JSON.parse(
        sessionStorage.getItem('artifyUser') || 'null'
      );
      const idUsuario = Number(usuario?.id);
      const formatoNormalizado = String(formato || '').toLowerCase();

      if (
        !Number.isSafeInteger(idUsuario) ||
        idUsuario <= 0 ||
        typeof dataUrl !== 'string' ||
        !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl) ||
        !['png', 'jpeg', 'webp'].includes(formatoNormalizado)
      ) {
        return false;
      }

      const respaldo = {
        version: 1,
        idUsuario,
        timestamp: Date.now(),
        dataUrl,
        formato: formatoNormalizado,
        nombreOriginal:
          typeof nombreOriginal === 'string' && nombreOriginal.trim()
            ? nombreOriginal.trim().slice(0, 255)
            : `imagen-recuperada.${formatoNormalizado}`,
        tamanoBytes:
          Number.isSafeInteger(tamanoBytes) && tamanoBytes > 0
            ? tamanoBytes
            : 0,
      };

      localStorage.setItem(RESPALDO_LOCAL_KEY, JSON.stringify(respaldo));
      RESPALDO_LEGACY_KEYS.forEach((clave) => localStorage.removeItem(clave));
      return true;
    } catch {
      return false;
    }
  }

  function leerRespaldoLocalParaUsuario(idUsuario, ahora = Date.now()) {
    RESPALDO_LEGACY_KEYS.forEach((clave) => {
      try {
        localStorage.removeItem(clave);
      } catch {}
    });

    try {
      const respaldo = JSON.parse(localStorage.getItem(RESPALDO_LOCAL_KEY));
      const idNormalizado = Number(idUsuario);
      const esValido =
        respaldo?.version === 1 &&
        Number.isSafeInteger(idNormalizado) &&
        idNormalizado > 0 &&
        respaldo.idUsuario === idNormalizado &&
        Number.isFinite(respaldo.timestamp) &&
        respaldo.timestamp <= ahora &&
        ahora - respaldo.timestamp <= RESPALDO_EXPIRACION_MS &&
        typeof respaldo.dataUrl === 'string' &&
        /^data:image\/(png|jpeg|webp);base64,/.test(respaldo.dataUrl) &&
        ['png', 'jpeg', 'webp'].includes(respaldo.formato);

      if (!esValido) {
        eliminarRespaldoLocal();
        return null;
      }

      return respaldo;
    } catch {
      eliminarRespaldoLocal();
      return null;
    }
  }

  return {
    eliminarRespaldoLocal,
    guardarRespaldoLocal,
    leerRespaldoLocalParaUsuario,
  };
})();
