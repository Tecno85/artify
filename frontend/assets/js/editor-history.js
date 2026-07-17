window.ArtifyEditorHistory = (() => {
  let configuracion = null;
  let paginaActual = 1;
  let eventosRegistrados = false;

  function obtenerElementos() {
    return {
      lista: document.getElementById('perfilHistorialOperaciones'),
      anterior: document.getElementById('historialAnterior'),
      siguiente: document.getElementById('historialSiguiente'),
      pagina: document.getElementById('historialPagina'),
    };
  }

  function mostrarMensaje(mensaje) {
    const { lista } = obtenerElementos();
    if (!lista) return;

    const item = document.createElement('li');
    item.className = 'perfil-historial-vacio';
    item.textContent = mensaje;
    lista.replaceChildren(item);
  }

  function renderizarOperacion(operacion) {
    const item = document.createElement('li');
    item.className = 'perfil-historial-item';

    const titulo = document.createElement('strong');
    titulo.textContent = operacion.descripcion || operacion.tipo || 'Operación';

    const detalle = document.createElement('span');
    const fecha = new Date(operacion.fecha);
    detalle.textContent = Number.isNaN(fecha.getTime())
      ? operacion.tipo || ''
      : `${operacion.tipo || 'operación'} · ${fecha.toLocaleString('es-CO', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}`;

    item.append(titulo, detalle);
    return item;
  }

  function renderizar(data) {
    const { lista, anterior, siguiente, pagina } = obtenerElementos();
    if (!lista) return;

    if (!Array.isArray(data.operaciones) || data.operaciones.length === 0) {
      mostrarMensaje('Aún no hay operaciones registradas.');
    } else {
      lista.replaceChildren(...data.operaciones.map(renderizarOperacion));
    }

    const paginacion = data.paginacion || {};
    paginaActual = Number(paginacion.pagina) || 1;
    const totalPaginas = Number(paginacion.totalPaginas) || 0;

    if (pagina) {
      pagina.textContent =
        totalPaginas > 0
          ? `Página ${paginaActual} de ${totalPaginas}`
          : 'Sin páginas';
    }
    if (anterior) anterior.disabled = !paginacion.tieneAnterior;
    if (siguiente) siguiente.disabled = !paginacion.tieneSiguiente;
  }

  async function cargar(pagina = 1) {
    if (!configuracion) return;

    mostrarMensaje('Cargando historial...');

    try {
      const respuesta = await configuracion.solicitar(
        `${configuracion.api}/api/operacion/historial/${configuracion.idUsuario}?pagina=${pagina}&limite=5`
      );
      const data = await respuesta.json();

      if (!respuesta.ok || data.mensaje !== 'ok') {
        throw new Error(data.mensaje || 'No se pudo cargar el historial');
      }

      renderizar(data);
    } catch {
      mostrarMensaje('No se pudo cargar el historial.');
      const { anterior, siguiente, pagina: indicador } = obtenerElementos();
      if (anterior) anterior.disabled = true;
      if (siguiente) siguiente.disabled = true;
      if (indicador) indicador.textContent = 'No disponible';
    }
  }

  function registrarEventos() {
    if (eventosRegistrados) return;

    const { anterior, siguiente } = obtenerElementos();
    anterior?.addEventListener('click', () => cargar(paginaActual - 1));
    siguiente?.addEventListener('click', () => cargar(paginaActual + 1));
    eventosRegistrados = true;
  }

  function abrir({ api, solicitar, idUsuario }) {
    configuracion = { api, solicitar, idUsuario };
    registrarEventos();
    return cargar(1);
  }

  return { abrir };
})();
