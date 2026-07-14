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

test('admin escapa HTML y protege la cuenta administrativa actual', () => {
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
  contextoFrontend.sessionStorage.setItem(
    'artifyUser',
    JSON.stringify({
      id: 7,
      nombres: 'Admin',
      apellidos: 'Artify',
      correo: 'admin@artify.local',
      rol: 'admin',
    })
  );
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

  evaluar(
    contextoFrontend.contexto,
    `renderizarTabla([
      {
        usr_id_usuario: 7,
        usr_nombres: 'Admin',
        usr_apellidos: 'Artify',
        usr_cedula: '1234567',
        usr_correo: 'admin@artify.local',
        usr_estado_usuario: 'activo',
        usr_rol: 'admin'
      },
      {
        usr_id_usuario: 8,
        usr_nombres: 'Usuario',
        usr_apellidos: 'Prueba',
        usr_cedula: '7654321',
        usr_correo: 'usuario@artify.local',
        usr_estado_usuario: 'activo',
        usr_rol: 'usuario'
      }
    ])`
  );

  const tabla = elementos.get('tablaBody').innerHTML;
  assert.match(tabla, /Cuenta actual/);
  assert.doesNotMatch(tabla, /abrirEliminar\(7\)/);
  assert.match(tabla, /abrirEliminar\(8\)/);
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
