const assert = require('node:assert/strict');
const test = require('node:test');

const {
  crearContextoFrontend,
  crearElemento,
  ejecutarScript,
  esperarPromesas,
} = require('./helpers/frontend-vm');

function crearEscenarioLogin(respuestaFetch) {
  const email = crearElemento();
  const password = crearElemento({ type: 'password' });
  const emailError = crearElemento();
  const passwordError = crearElemento();
  const eyeIcon = crearElemento();
  const remember = crearElemento({ checked: false });
  const togglePassword = crearElemento();
  const botonSubmit = crearElemento({ textContent: 'Iniciar Sesión' });
  const loginForm = crearElemento({
    querySelector(selector) {
      return selector === 'button[type="submit"]' ? botonSubmit : null;
    },
  });
  const elementos = {
    email,
    password,
    'email-error': emailError,
    'password-error': passwordError,
    'eye-icon': eyeIcon,
    remember,
    loginForm,
  };
  const solicitudes = [];
  const document = {
    getElementById(id) {
      return elementos[id] || null;
    },
    querySelector(selector) {
      return selector === '.toggle-password' ? togglePassword : null;
    },
  };
  const contextoFrontend = crearContextoFrontend({
    apiUrl: 'http://api.artify.test',
    document,
    location: { pathname: '/pages/login.html' },
    fetch: async (url, options) => {
      solicitudes.push({ url, options });
      return {
        json: async () => respuestaFetch,
      };
    },
  });

  ejecutarScript(contextoFrontend.contexto, 'auth.js');
  ejecutarScript(contextoFrontend.contexto, 'login.js');

  return {
    ...contextoFrontend,
    botonSubmit,
    email,
    emailError,
    loginForm,
    password,
    passwordError,
    remember,
    solicitudes,
  };
}

function enviarFormulario(escenario) {
  let envioPrevenido = false;
  escenario.loginForm.obtenerManejador('submit')({
    preventDefault() {
      envioPrevenido = true;
    },
  });

  return envioPrevenido;
}

test('login valida correo y contraseña antes de consultar el backend', () => {
  const escenario = crearEscenarioLogin({});
  escenario.email.value = 'correo-invalido';
  escenario.password.value = '123';

  assert.equal(enviarFormulario(escenario), true);
  assert.equal(escenario.solicitudes.length, 0);
  assert.equal(escenario.emailError.classList.contains('show'), true);
  assert.equal(escenario.passwordError.classList.contains('show'), true);
  assert.equal(escenario.email.classList.contains('error'), true);
  assert.equal(escenario.password.classList.contains('error'), true);
});

test('login guarda la sesión y dirige usuarios normales al editor', async () => {
  const usuario = {
    id: 7,
    nombres: 'Ana',
    apellidos: 'Prueba',
    correo: 'ana@artify.local',
    rol: 'usuario',
  };
  const escenario = crearEscenarioLogin({
    mensaje: 'Login exitoso',
    usuario,
    token: 'token-usuario',
  });
  escenario.email.value = usuario.correo;
  escenario.password.value = 'Password123';

  enviarFormulario(escenario);
  await esperarPromesas();

  assert.equal(escenario.solicitudes.length, 1);
  assert.equal(escenario.solicitudes[0].url, 'http://api.artify.test/api/login');
  assert.deepEqual(JSON.parse(escenario.solicitudes[0].options.body), {
    correo: usuario.correo,
    password: 'Password123',
  });
  assert.deepEqual(
    JSON.parse(escenario.sessionStorage.getItem('artifyUser')),
    usuario
  );
  assert.equal(
    escenario.sessionStorage.getItem('artifyToken'),
    'token-usuario'
  );
  assert.equal(escenario.window.location.href, './editor.html');
  assert.equal(escenario.botonSubmit.disabled, false);
  assert.equal(escenario.botonSubmit.textContent, 'Iniciar Sesión');
});

test('login dirige administradores al panel correspondiente', async () => {
  const escenario = crearEscenarioLogin({
    mensaje: 'Login exitoso',
    usuario: {
      id: 9,
      nombres: 'Admin',
      apellidos: 'Artify',
      correo: 'admin@artify.local',
      rol: 'admin',
    },
    token: 'token-admin',
  });
  escenario.email.value = 'admin@artify.local';
  escenario.password.value = 'Password123';

  enviarFormulario(escenario);
  await esperarPromesas();

  assert.equal(escenario.window.location.href, './admin.html');
  assert.equal(escenario.sessionStorage.getItem('artifyToken'), 'token-admin');
});

test('login conserva la sesión en el navegador cuando se solicita recordarla', async () => {
  const usuario = {
    id: 11,
    nombres: 'Luis',
    apellidos: 'Prueba',
    correo: 'luis@artify.local',
    rol: 'usuario',
  };
  const escenario = crearEscenarioLogin({
    mensaje: 'Login exitoso',
    usuario,
    token: 'token-recordado',
  });
  escenario.email.value = usuario.correo;
  escenario.password.value = 'Password123';
  escenario.remember.checked = true;

  enviarFormulario(escenario);
  await esperarPromesas();

  assert.equal(
    escenario.localStorage.getItem('artifyToken'),
    'token-recordado'
  );
  assert.deepEqual(
    JSON.parse(escenario.localStorage.getItem('artifyUser')),
    usuario
  );
  assert.equal(escenario.sessionStorage.getItem('artifyToken'), null);
  assert.equal(escenario.window.location.href, './editor.html');
});
