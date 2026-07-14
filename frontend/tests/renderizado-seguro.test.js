const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  crearContextoFrontend,
  crearElemento,
  ejecutarScript,
  evaluar,
} = require('./helpers/frontend-vm');

test('admin escapa caracteres HTML antes de renderizar datos de usuario', () => {
  const elementos = new Map();
  const document = {
    addEventListener() {},
    getElementById(id) {
      if (!elementos.has(id)) {
        elementos.set(
          id,
          crearElemento({
            dataset: {},
            style: {},
          })
        );
      }

      return elementos.get(id);
    },
    querySelectorAll() {
      return [];
    },
  };
  const contextoFrontend = crearContextoFrontend({ document });
  contextoFrontend.contexto.API = 'http://api.artify.test';
  contextoFrontend.contexto.fetchAuth = async () => ({
    json: async () => ({ mensaje: 'ok', usuarios: [] }),
  });
  contextoFrontend.contexto.obtenerTokenAuth = () => 'token-admin';
  contextoFrontend.contexto.limpiarSesionAuth = () => {};
  ejecutarScript(contextoFrontend.contexto, 'admin.js');
  contextoFrontend.contexto.valorMalicioso =
    '<img src=x onerror="alert(1)"> &\' ataque';

  const resultado = evaluar(
    contextoFrontend.contexto,
    'escaparHtml(valorMalicioso)'
  );

  assert.equal(
    resultado,
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp;&#39; ataque'
  );
});

test('notificaciones muestran mensajes como texto y no como HTML ejecutable', () => {
  const rutaJs = path.resolve(__dirname, '..', 'assets', 'js');
  const editor = fs.readFileSync(path.join(rutaJs, 'editor.js'), 'utf8');
  const registro = fs.readFileSync(path.join(rutaJs, 'registro.js'), 'utf8');

  assert.match(editor, /contenido\.textContent = String\(mensaje\)/);
  assert.match(registro, /contenido\.textContent = String\(mensaje\)/);
  assert.doesNotMatch(editor, /innerHTML\s*=\s*`[^`]*\$\{mensaje\}/s);
  assert.doesNotMatch(registro, /innerHTML\s*=\s*`[^`]*\$\{mensaje\}/s);
});
