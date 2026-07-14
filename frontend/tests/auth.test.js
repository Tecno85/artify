const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AlmacenamientoSimulado,
  crearContextoFrontend,
  ejecutarScript,
  evaluar,
} = require('./helpers/frontend-vm');

test('auth guarda el token y construye headers sin modificar el objeto original', () => {
  const { contexto, sessionStorage } = crearContextoFrontend();
  ejecutarScript(contexto, 'auth.js');

  evaluar(contexto, "guardarTokenAuth('token-seguro')");
  const headersOriginales = { 'Content-Type': 'application/json' };
  contexto.headersOriginales = headersOriginales;
  const headers = evaluar(
    contexto,
    'construirHeadersAuth(headersOriginales)'
  );

  assert.equal(sessionStorage.getItem('artifyToken'), 'token-seguro');
  assert.equal(headers.Authorization, 'Bearer token-seguro');
  assert.equal(headers['Content-Type'], 'application/json');
  assert.deepEqual(headersOriginales, { 'Content-Type': 'application/json' });
});

test('auth limpia todos los datos locales relacionados con la sesión', () => {
  const sessionStorage = new AlmacenamientoSimulado({
    artifyAdmin: '{}',
    artifyUser: '{}',
    artifyToken: 'token',
    artifyIdSesion: '25',
  });
  const localStorage = new AlmacenamientoSimulado({
    artify_backup_v1: '{"version":1}',
    artify_backup_image: 'imagen',
    artify_backup_timestamp: '123',
    preferencia_no_relacionada: 'conservar',
  });
  const contextoFrontend = crearContextoFrontend({
    sessionStorage,
    localStorage,
  });
  ejecutarScript(contextoFrontend.contexto, 'auth.js');

  evaluar(contextoFrontend.contexto, 'limpiarSesionAuth()');

  assert.equal(sessionStorage.getItem('artifyAdmin'), null);
  assert.equal(sessionStorage.getItem('artifyUser'), null);
  assert.equal(sessionStorage.getItem('artifyToken'), null);
  assert.equal(sessionStorage.getItem('artifyIdSesion'), null);
  assert.equal(localStorage.getItem('artify_backup_v1'), null);
  assert.equal(localStorage.getItem('artify_backup_image'), null);
  assert.equal(localStorage.getItem('artify_backup_timestamp'), null);
  assert.equal(localStorage.getItem('preferencia_no_relacionada'), 'conservar');
});

test('fetchAuth adjunta el token y redirige al login ante un 401', async () => {
  let solicitud;
  const sessionStorage = new AlmacenamientoSimulado({
    artifyUser: '{"id":7}',
    artifyToken: 'token-vigente',
  });
  const contextoFrontend = crearContextoFrontend({
    sessionStorage,
    fetch: async (url, options) => {
      solicitud = { url, options };
      return { status: 401 };
    },
  });
  ejecutarScript(contextoFrontend.contexto, 'auth.js');

  await evaluar(
    contextoFrontend.contexto,
    "fetchAuth('http://api.test/recurso', { headers: { Accept: 'application/json' } })"
  );

  assert.equal(solicitud.url, 'http://api.test/recurso');
  assert.equal(solicitud.options.headers.Authorization, 'Bearer token-vigente');
  assert.equal(solicitud.options.headers.Accept, 'application/json');
  assert.equal(sessionStorage.getItem('artifyToken'), null);
  assert.deepEqual(contextoFrontend.reemplazos, ['./login.html']);
});

test('fetchAuth no genera una redirección repetida desde el propio login', async () => {
  const contextoFrontend = crearContextoFrontend({
    location: { pathname: '/pages/login.html' },
    fetch: async () => ({ status: 401 }),
  });
  ejecutarScript(contextoFrontend.contexto, 'auth.js');

  await evaluar(
    contextoFrontend.contexto,
    "fetchAuth('http://api.test/recurso')"
  );

  assert.deepEqual(contextoFrontend.reemplazos, []);
});
