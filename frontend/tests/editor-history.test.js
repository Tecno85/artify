const assert = require('node:assert/strict');
const test = require('node:test');

const {
  crearContextoFrontend,
  crearElemento,
  ejecutarScript,
  evaluar,
} = require('./helpers/frontend-vm');

function crearEscenario(respuestas) {
  const elementos = {
    perfilHistorialOperaciones: crearElemento(),
    historialAnterior: crearElemento(),
    historialSiguiente: crearElemento(),
    historialPagina: crearElemento(),
  };
  const document = {
    createElement: () => crearElemento(),
    getElementById: (id) => elementos[id] || null,
  };
  const escenario = crearContextoFrontend({ document });
  const urls = [];

  escenario.contexto.solicitarPrueba = async (url) => {
    urls.push(url);
    const pagina = Number(new URL(url).searchParams.get('pagina'));
    return {
      ok: true,
      json: async () => respuestas[pagina],
    };
  };
  ejecutarScript(escenario.contexto, 'editor-history.js');

  return { ...escenario, elementos, urls };
}

test('historial renderiza texto seguro y navega entre páginas', async () => {
  const escenario = crearEscenario({
    1: {
      mensaje: 'ok',
      operaciones: [
        {
          tipo: 'filtro',
          descripcion: '<img src=x onerror=alert(1)>',
          fecha: '2026-07-17T12:00:00.000Z',
        },
      ],
      paginacion: {
        pagina: 1,
        totalPaginas: 2,
        tieneAnterior: false,
        tieneSiguiente: true,
      },
    },
    2: {
      mensaje: 'ok',
      operaciones: [],
      paginacion: {
        pagina: 2,
        totalPaginas: 2,
        tieneAnterior: true,
        tieneSiguiente: false,
      },
    },
  });

  await evaluar(
    escenario.contexto,
    'window.ArtifyEditorHistory.abrir({ api: "http://api.artify.test", solicitar: solicitarPrueba, idUsuario: 7 })'
  );

  const primerItem =
    escenario.elementos.perfilHistorialOperaciones.children[0];
  assert.equal(
    primerItem.children[0].textContent,
    '<img src=x onerror=alert(1)>'
  );
  assert.equal(escenario.elementos.historialPagina.textContent, 'Página 1 de 2');
  assert.equal(escenario.elementos.historialSiguiente.disabled, false);

  await escenario.elementos.historialSiguiente.obtenerManejador('click')();
  assert.equal(escenario.urls.length, 2);
  assert.match(escenario.urls[1], /pagina=2/);
  assert.equal(
    escenario.elementos.perfilHistorialOperaciones.children[0].textContent,
    'Aún no hay operaciones registradas.'
  );
  assert.equal(escenario.elementos.historialAnterior.disabled, false);
});
