const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AlmacenamientoSimulado,
  crearContextoFrontend,
  ejecutarScript,
  evaluar,
} = require('./helpers/frontend-vm');

function crearEscenarioEditor(fetchAuth) {
  const usuario = {
    id: 7,
    nombres: 'Usuario',
    apellidos: 'Editor',
    rol: 'usuario',
  };
  const sessionStorage = new AlmacenamientoSimulado({
    artifyUser: JSON.stringify(usuario),
    artifyToken: 'token-editor',
  });
  const contextoFrontend = crearContextoFrontend({ sessionStorage });
  contextoFrontend.contexto.API = 'http://api.artify.test';
  contextoFrontend.contexto.fetchAuth = fetchAuth;
  contextoFrontend.contexto.obtenerTokenAuth = () =>
    sessionStorage.getItem('artifyToken');
  contextoFrontend.contexto.limpiarSesionAuth = () => sessionStorage.clear();
  ejecutarScript(contextoFrontend.contexto, 'editor-storage.js');
  ejecutarScript(contextoFrontend.contexto, 'editor-image.js');
  ejecutarScript(contextoFrontend.contexto, 'editor.js');

  return { ...contextoFrontend, usuario };
}

test('editor inicia la sesión en segundo plano sin bloquear su inicialización', async () => {
  let resolverSolicitud;
  const escenario = crearEscenarioEditor(
    () =>
      new Promise((resolve) => {
        resolverSolicitud = resolve;
      })
  );

  escenario.contexto.usuarioPrueba = escenario.usuario;
  const promesa = evaluar(
    escenario.contexto,
    'iniciarSesionEdicionEnSegundoPlano(usuarioPrueba)'
  );

  assert.equal(typeof promesa.then, 'function');
  assert.equal(escenario.sessionStorage.getItem('artifyIdSesion'), null);

  resolverSolicitud({
    status: 200,
    ok: true,
    json: async () => ({ mensaje: 'Sesión iniciada', idSesion: 42 }),
  });

  assert.equal(await promesa, 42);
  assert.equal(escenario.sessionStorage.getItem('artifyIdSesion'), '42');

  escenario.contexto.datosRespaldo = {
    dataUrl: 'data:image/png;base64,AAAA',
    formato: 'png',
    nombreOriginal: 'prueba.png',
    tamanoBytes: 128,
  };
  assert.equal(
    evaluar(escenario.contexto, 'guardarRespaldoLocal(datosRespaldo)'),
    true
  );
  const respaldo = evaluar(
    escenario.contexto,
    'leerRespaldoLocalParaUsuario(7)'
  );
  assert.equal(respaldo.idUsuario, 7);
  assert.equal(respaldo.nombreOriginal, 'prueba.png');
  assert.equal(respaldo.formato, 'png');
});

test('editor descarta una sesión tardía si el usuario autenticado cambió', async () => {
  let resolverSolicitud;
  const escenario = crearEscenarioEditor(
    () =>
      new Promise((resolve) => {
        resolverSolicitud = resolve;
      })
  );

  escenario.contexto.usuarioPrueba = escenario.usuario;
  escenario.contexto.datosRespaldo = {
    dataUrl: 'data:image/webp;base64,AAAA',
    formato: 'webp',
    nombreOriginal: 'privada.webp',
    tamanoBytes: 256,
  };
  assert.equal(
    evaluar(escenario.contexto, 'guardarRespaldoLocal(datosRespaldo)'),
    true
  );
  const promesa = evaluar(
    escenario.contexto,
    'iniciarSesionEdicionEnSegundoPlano(usuarioPrueba)'
  );
  escenario.sessionStorage.setItem(
    'artifyUser',
    JSON.stringify({ ...escenario.usuario, id: 99 })
  );
  resolverSolicitud({
    status: 200,
    ok: true,
    json: async () => ({ mensaje: 'Sesión iniciada', idSesion: 43 }),
  });

  assert.equal(await promesa, null);
  assert.equal(escenario.sessionStorage.getItem('artifyIdSesion'), null);
  assert.equal(
    evaluar(escenario.contexto, 'leerRespaldoLocalParaUsuario(99)'),
    null
  );
  assert.equal(escenario.localStorage.getItem('artify_backup_v1'), null);
});

test('editor limpia la sesión y vuelve al login cuando la API rechaza el token', async () => {
  const escenario = crearEscenarioEditor(async () => ({
    status: 401,
    ok: false,
    json: async () => ({ mensaje: 'Token inválido' }),
  }));
  escenario.contexto.usuarioPrueba = escenario.usuario;

  const resultado = await evaluar(
    escenario.contexto,
    'iniciarSesionEdicionEnSegundoPlano(usuarioPrueba)'
  );

  assert.equal(resultado, null);
  assert.equal(escenario.sessionStorage.getItem('artifyToken'), null);
  assert.equal(escenario.window.location.href, './login.html');
});
