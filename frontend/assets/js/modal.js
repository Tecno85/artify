// ========== GESTIÓN ACCESIBLE DE MODALES ==========
(function inicializarModalesAccesibles() {
  const focosAnteriores = new WeakMap();
  const manejadoresCierre = new WeakMap();
  const selectorEnfocable = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  function obtenerElementosEnfocables(modal) {
    return Array.from(modal.querySelectorAll(selectorEnfocable)).filter(
      (elemento) =>
        elemento.getAttribute('aria-hidden') !== 'true' &&
        elemento.offsetParent !== null
    );
  }

  function registrar(modal, cerrar) {
    if (modal && typeof cerrar === 'function') {
      manejadoresCierre.set(modal, cerrar);
    }
  }

  function abrir(modal, { disparador, focoInicial } = {}) {
    if (!modal) return;

    const focoPrevio = disparador || document.activeElement;
    if (focoPrevio && typeof focoPrevio.focus === 'function') {
      focosAnteriores.set(modal, focoPrevio);
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      const objetivo =
        (typeof focoInicial === 'string'
          ? modal.querySelector(focoInicial)
          : focoInicial) || obtenerElementosEnfocables(modal)[0];

      if (objetivo && typeof objetivo.focus === 'function') {
        objetivo.focus();
      }
    });
  }

  function cerrar(modal) {
    if (!modal) return;

    modal.style.display = 'none';
    const focoPrevio = focosAnteriores.get(modal);
    focosAnteriores.delete(modal);

    requestAnimationFrame(() => {
      if (
        focoPrevio &&
        focoPrevio.isConnected !== false &&
        typeof focoPrevio.focus === 'function'
      ) {
        focoPrevio.focus();
      }
    });
  }

  function obtenerModalVisible() {
    const modales = Array.from(
      document.querySelectorAll('[role="dialog"][aria-modal="true"]')
    );

    for (let indice = modales.length - 1; indice >= 0; indice -= 1) {
      if (modales[indice].style.display !== 'none') {
        return modales[indice];
      }
    }

    return null;
  }

  document.addEventListener('keydown', (evento) => {
    const modal = obtenerModalVisible();
    if (!modal) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      const cerrarRegistrado = manejadoresCierre.get(modal);
      if (cerrarRegistrado) cerrarRegistrado();
      else cerrar(modal);
      return;
    }

    if (evento.key !== 'Tab') return;

    const enfocables = obtenerElementosEnfocables(modal);
    if (enfocables.length === 0) {
      evento.preventDefault();
      return;
    }

    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];

    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  });

  window.ArtifyModal = {
    abrir,
    cerrar,
    registrar,
  };
})();
