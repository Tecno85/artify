const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const dotenv = require('dotenv');
const { Pool } = require('pg');
const {
  validarBaseDatosPruebas,
} = require('./helpers/test-database-guard');

dotenv.config({ quiet: true });
validarBaseDatosPruebas();

const PORT = process.env.TEST_PORT || '3100';
const API = `http://127.0.0.1:${PORT}`;
const stamp = Date.now().toString().slice(-10);
const usuarioPrueba = {
  nombres: 'Usuario',
  apellidos: 'Prueba Artify',
  cedula: stamp,
  fechaNacimiento: '1995-05-12',
  correo: `test.${stamp}@artify.local`,
  password: 'PruebaArtify123!',
};

let serverProcess;
let idUsuario;
let tokenUsuario;
let tokenAdmin;
let idSesion;

function crearConexionDb() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

function base64UrlEncode(valor) {
  return Buffer.from(valor)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function crearTokenExpirado(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const firma = crypto
    .createHmac('sha256', process.env.TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${header}.${body}.${firma}`;
}

async function esperarBackend() {
  const inicio = Date.now();
  let ultimoError;

  while (Date.now() - inicio < 8000) {
    try {
      const response = await fetch(`${API}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      ultimoError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw ultimoError || new Error('El backend de prueba no respondió a tiempo');
}

async function detenerBackend() {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  const salida = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('El backend no terminó de forma ordenada en 10 segundos'));
    }, 10_000);

    serverProcess.once('exit', (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });

  assert.equal(serverProcess.kill('SIGTERM'), true);
  const resultado = await salida;
  assert.equal(resultado.code, 0);
  assert.equal(resultado.signal, null);
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  let body;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

async function obtenerUsuarioTemporal() {
  const db = await crearConexionDb();

  try {
    const { rows } = await db.query(
      `SELECT usr_id_usuario, usr_correo, usr_contrasena,
              usr_ultimo_acceso, usr_sesion_activa
       FROM "USUARIO"
       WHERE usr_id_usuario = $1`,
      [idUsuario]
    );

    return rows[0];
  } finally {
    await db.end();
  }
}

async function esperarActualizacionAcceso() {
  const inicio = Date.now();
  let usuario;

  while (Date.now() - inicio < 3000) {
    usuario = await obtenerUsuarioTemporal();

    if (usuario?.usr_ultimo_acceso && usuario.usr_sesion_activa === true) {
      return usuario;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return usuario;
}

async function promoverUsuarioTemporalAAdmin() {
  const db = await crearConexionDb();

  try {
    await db.query(
      `UPDATE "USUARIO"
       SET usr_rol = 'admin'
       WHERE usr_id_usuario = $1`,
      [idUsuario]
    );
  } finally {
    await db.end();
  }
}

async function actualizarEstadoUsuario(estado) {
  const db = await crearConexionDb();

  try {
    await db.query(
      `UPDATE "USUARIO"
       SET usr_estado_usuario = $1
       WHERE usr_id_usuario = $2`,
      [estado, idUsuario]
    );
  } finally {
    await db.end();
  }
}

async function limpiarUsuarioTemporal() {
  if (!idUsuario) {
    return;
  }

  const db = await crearConexionDb();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM "OPERACION" WHERE opr_usr_id_usuario = $1', [
      idUsuario,
    ]);
    await client.query('DELETE FROM "SESION_EDICION" WHERE ses_usr_id_usuario = $1', [
      idUsuario,
    ]);
    await client.query('DELETE FROM "IMAGEN" WHERE img_usr_id_usuario = $1', [
      idUsuario,
    ]);
    await client.query('DELETE FROM "CONFIGURACION" WHERE cfg_usr_id_usuario = $1', [
      idUsuario,
    ]);
    await client.query('DELETE FROM "USUARIO" WHERE usr_id_usuario = $1', [idUsuario]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

before(async () => {
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: __dirname + '/..',
    env: {
      ...process.env,
      PORT,
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (data) => {
    if (process.env.DEBUG_TEST_SERVER) {
      process.stdout.write(data);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    if (process.env.DEBUG_TEST_SERVER) {
      process.stderr.write(data);
    }
  });

  await esperarBackend();
});

after(async () => {
  await limpiarUsuarioTemporal();
  await detenerBackend();
});

test('health público responde sin consultar credenciales', async () => {
  const { response, body } = await request('/health');

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.servicio, 'artify-api');
  assert.equal(body.entorno, 'test');
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('ready confirma que PostgreSQL está disponible', async () => {
  const { response, body } = await request('/ready');

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.baseDatos, 'disponible');
});

test('analytics público responde correctamente', async () => {
  const { response, body } = await request(
    '/api/v1/analytics/filtros-populares'
  );

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.mensaje, 'Top filtros utilizados');
});

test('login rechaza correo inválido antes de consultar credenciales', async () => {
  const { response, body } = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'correo-invalido', password: '12345678' }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.mensaje, 'Ingresa un correo válido');
});

test('login rechaza correo no registrado', async () => {
  const { response, body } = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: `no.existe.${stamp}@artify.local`,
      password: usuarioPrueba.password,
    }),
  });

  assert.equal(response.status, 401);
  assert.equal(body.mensaje, 'Credenciales incorrectas');
});

test('registro rechaza fechas de nacimiento inexistentes', async () => {
  const { response, body } = await request('/api/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...usuarioPrueba,
      cedula: `${stamp}99`.slice(-10),
      correo: `fecha.${stamp}@artify.local`,
      fechaNacimiento: '2026-02-31',
    }),
  });

  assert.equal(response.status, 400);
  assert.equal(body.mensaje, 'Ingresa una fecha de nacimiento válida');
});

test('registro, login y flujo básico de usuario funcionan', async () => {
  const registro = await request('/api/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...usuarioPrueba,
      nombres: ` ${usuarioPrueba.nombres} `,
      correo: ` ${usuarioPrueba.correo.toUpperCase()} `,
    }),
  });

  assert.equal(registro.response.status, 200);
  assert.equal(registro.body.mensaje, 'Registro exitoso');
  assert.ok(registro.body.usuario.id);
  idUsuario = registro.body.usuario.id;

  const usuarioRegistrado = await obtenerUsuarioTemporal();
  assert.equal(usuarioRegistrado.usr_correo, usuarioPrueba.correo);
  assert.notEqual(usuarioRegistrado.usr_contrasena, usuarioPrueba.password);
  assert.match(usuarioRegistrado.usr_contrasena, /^\$2[ab]\$10\$/);

  const login = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: usuarioPrueba.correo,
      password: usuarioPrueba.password,
    }),
  });

  assert.equal(login.response.status, 200);
  assert.equal(login.body.mensaje, 'Login exitoso');
  assert.ok(login.body.token);
  tokenUsuario = login.body.token;

  const usuarioAutenticado = await esperarActualizacionAcceso();
  assert.ok(usuarioAutenticado.usr_ultimo_acceso);
  assert.equal(usuarioAutenticado.usr_sesion_activa, true);

  const authHeaders = {
    Authorization: `Bearer ${tokenUsuario}`,
    'Content-Type': 'application/json',
  };

  const sesion = await request('/api/sesion/iniciar', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ idUsuario }),
  });

  assert.equal(sesion.response.status, 200);
  assert.equal(sesion.body.mensaje, 'Sesión iniciada');
  assert.ok(sesion.body.idSesion);
  idSesion = sesion.body.idSesion;

  const configuracion = await request(`/api/configuracion/${idUsuario}`, {
    headers: { Authorization: `Bearer ${tokenUsuario}` },
  });

  assert.equal(configuracion.response.status, 200);
  assert.equal(configuracion.body.mensaje, 'ok');

  const configuracionInvalida = await request('/api/configuracion', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      idUsuario,
      calidadExportacion: 'ilimitada',
      notificaciones: true,
      formatoDefecto: 'png',
      autoguardado: false,
    }),
  });

  assert.equal(configuracionInvalida.response.status, 400);
  assert.equal(
    configuracionInvalida.body.mensaje,
    'Selecciona una calidad de exportación válida'
  );

  const operacion = await request('/api/operacion', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      idUsuario,
      idSesion,
      tipo: 'filtro',
      descripcion: 'Filtro aplicado: Sepia',
      parametros: { filtro: 'Sepia' },
    }),
  });

  assert.equal(operacion.response.status, 200);
  assert.equal(operacion.body.mensaje, 'Operación registrada');

  const analytics = await request('/api/v1/analytics/filtros-populares');
  const filtroPrueba = analytics.body.data.filtros.find(
    (item) => item.filtro === 'Sepia'
  );

  assert.equal(analytics.response.status, 200);
  assert.ok(filtroPrueba);
  assert.equal(typeof filtroPrueba.usos, 'number');
  assert.equal(typeof filtroPrueba.porcentaje, 'number');

  const imagen = await request('/api/imagen', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      idUsuario,
      idSesion,
      nombreOriginal: 'prueba.png',
      formatoOriginal: 'png',
      formatoFinal: 'webp',
      tamanoOriginal: 2048,
      anchoOriginal: 640,
      altoOriginal: 480,
    }),
  });

  assert.equal(imagen.response.status, 200);
  assert.equal(imagen.body.mensaje, 'Imagen registrada');
  assert.ok(imagen.body.idImagen);

  const estadisticas = await request(`/api/estadisticas/${idUsuario}`, {
    headers: { Authorization: `Bearer ${tokenUsuario}` },
  });

  assert.equal(estadisticas.response.status, 200);
  assert.equal(estadisticas.body.mensaje, 'ok');
  assert.ok(estadisticas.body.estadisticas.operaciones >= 1);

  const cierre = await request('/api/sesion/cerrar', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ idSesion }),
  });

  assert.equal(cierre.response.status, 200);
  assert.equal(cierre.body.mensaje, 'Sesión cerrada');

  const formatos = await request('/api/v1/analytics/formatos-preferidos');
  const formatoWebp = formatos.body.data.formatos.find(
    (item) => item.formato === 'webp'
  );

  assert.equal(formatos.response.status, 200);
  assert.ok(formatoWebp);
  assert.ok(formatoWebp.descargas >= 1);

  const conversion = await request('/api/v1/analytics/tasa-conversion');
  assert.equal(conversion.response.status, 200);
  assert.ok(conversion.body.data.conversionData.sesiones_exitosas >= 1);
});

test('registro rechaza correo o cédula duplicados', async () => {
  assert.ok(idUsuario);

  const { response, body } = await request('/api/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuarioPrueba),
  });

  assert.equal(response.status, 400);
  assert.equal(body.mensaje, 'El correo o cédula ya está registrado');
});

test('login rechaza contraseña incorrecta', async () => {
  assert.ok(idUsuario);

  const usuarioAntes = await obtenerUsuarioTemporal();

  const { response, body } = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: usuarioPrueba.correo,
      password: 'PasswordIncorrecto123!',
    }),
  });

  const usuarioDespues = await obtenerUsuarioTemporal();

  assert.equal(response.status, 401);
  assert.equal(body.mensaje, 'Credenciales incorrectas');
  assert.deepEqual(
    usuarioDespues.usr_ultimo_acceso,
    usuarioAntes.usr_ultimo_acceso
  );
});

test('logins correctos repetidos no consumen el límite de fallos', async () => {
  for (let intento = 0; intento < 11; intento++) {
    const { response, body } = await request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: usuarioPrueba.correo,
        password: usuarioPrueba.password,
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.mensaje, 'Login exitoso');
  }
});

test('el indicador de sesión permanece activo mientras exista otra sesión abierta', async () => {
  const headers = {
    Authorization: `Bearer ${tokenUsuario}`,
    'Content-Type': 'application/json',
  };
  const sesionUno = await request('/api/sesion/iniciar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ idUsuario }),
  });
  const sesionDos = await request('/api/sesion/iniciar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ idUsuario }),
  });

  assert.equal(sesionUno.response.status, 200);
  assert.equal(sesionDos.response.status, 200);

  const primerCierre = await request('/api/sesion/cerrar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ idSesion: sesionUno.body.idSesion }),
  });
  assert.equal(primerCierre.response.status, 200);
  assert.equal((await obtenerUsuarioTemporal()).usr_sesion_activa, true);

  const segundoCierre = await request('/api/sesion/cerrar', {
    method: 'POST',
    headers,
    body: JSON.stringify({ idSesion: sesionDos.body.idSesion }),
  });
  assert.equal(segundoCierre.response.status, 200);
  assert.equal((await obtenerUsuarioTemporal()).usr_sesion_activa, false);
});

test('rutas protegidas rechazan solicitudes sin token', async () => {
  const { response, body } = await request('/api/estadisticas/1');

  assert.equal(response.status, 401);
  assert.equal(body.mensaje, 'Token ausente, inválido o expirado');
});

test('rutas protegidas rechazan token inválido', async () => {
  const { response, body } = await request('/api/estadisticas/1', {
    headers: { Authorization: 'Bearer token.invalido.manipulado' },
  });

  assert.equal(response.status, 401);
  assert.equal(body.mensaje, 'Token ausente, inválido o expirado');
});

test('rutas protegidas rechazan token expirado', async () => {
  const tokenExpirado = crearTokenExpirado({
    id: idUsuario || 1,
    correo: usuarioPrueba.correo,
    rol: 'usuario',
    tipo: 'usuario',
    exp: Math.floor(Date.now() / 1000) - 60,
  });

  const { response, body } = await request('/api/estadisticas/1', {
    headers: { Authorization: `Bearer ${tokenExpirado}` },
  });

  assert.equal(response.status, 401);
  assert.equal(body.mensaje, 'Token expirado');
});

test('usuario no puede acceder a recursos de otro usuario', async () => {
  assert.ok(idUsuario);
  assert.ok(tokenUsuario);

  const idOtroUsuario = idUsuario + 999999;

  const estadisticas = await request(`/api/estadisticas/${idOtroUsuario}`, {
    headers: { Authorization: `Bearer ${tokenUsuario}` },
  });

  assert.equal(estadisticas.response.status, 403);
  assert.equal(
    estadisticas.body.mensaje,
    'No puedes acceder a recursos de otro usuario'
  );

  const operacion = await request('/api/operacion', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenUsuario}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idUsuario: idOtroUsuario,
      idSesion: idSesion || 1,
      tipo: 'prueba_no_autorizada',
      descripcion: 'Intento de acceso a recurso ajeno',
    }),
  });

  assert.equal(operacion.response.status, 403);
  assert.equal(
    operacion.body.mensaje,
    'No puedes modificar recursos de otro usuario'
  );
});

test('rutas protegidas rechazan identificadores malformados', async () => {
  assert.ok(idUsuario);
  assert.ok(idSesion);
  assert.ok(tokenUsuario);

  const estadisticas = await request(`/api/estadisticas/${idUsuario}abc`, {
    headers: { Authorization: `Bearer ${tokenUsuario}` },
  });

  assert.equal(estadisticas.response.status, 403);
  assert.equal(
    estadisticas.body.mensaje,
    'No puedes acceder a recursos de otro usuario'
  );

  const sesionInvalida = await request('/api/sesion/iniciar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenUsuario}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idUsuario: `${idUsuario}abc` }),
  });

  assert.equal(sesionInvalida.response.status, 403);
  assert.equal(
    sesionInvalida.body.mensaje,
    'No puedes modificar recursos de otro usuario'
  );

  const cierreInvalido = await request('/api/sesion/cerrar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenUsuario}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idSesion: `${idSesion}abc` }),
  });

  assert.equal(cierreInvalido.response.status, 400);
  assert.equal(cierreInvalido.body.mensaje, 'Datos de sesión inválidos');

  const operacionInvalida = await request('/api/operacion', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenUsuario}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idUsuario,
      idSesion: `${idSesion}abc`,
      tipo: 'prueba_id_invalido',
      descripcion: 'Intento con identificador malformado',
    }),
  });

  assert.equal(operacionInvalida.response.status, 400);
  assert.equal(
    operacionInvalida.body.mensaje,
    'Datos de operación inválidos'
  );
});

test('admin puede autenticarse desde el login principal y listar usuarios', async () => {
  assert.ok(idUsuario);
  await promoverUsuarioTemporalAAdmin();

  const login = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: usuarioPrueba.correo,
      password: usuarioPrueba.password,
    }),
  });

  assert.equal(login.response.status, 200);
  assert.equal(login.body.mensaje, 'Login exitoso');
  assert.equal(login.body.usuario.rol, 'admin');
  assert.ok(login.body.token);
  tokenAdmin = login.body.token;

  const usuarios = await request('/api/admin/usuarios', {
    headers: { Authorization: `Bearer ${login.body.token}` },
  });

  assert.equal(usuarios.response.status, 200);
  assert.equal(usuarios.body.mensaje, 'ok');
  assert.ok(Array.isArray(usuarios.body.usuarios));

  const editarIdInvalido = await request('/api/admin/usuario/abc', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${login.body.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  assert.equal(editarIdInvalido.response.status, 400);
  assert.equal(
    editarIdInvalido.body.mensaje,
    'Identificador de usuario inválido'
  );

  const eliminarIdInvalido = await request('/api/admin/usuario/abc', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${login.body.token}` },
  });

  assert.equal(eliminarIdInvalido.response.status, 400);
  assert.equal(
    eliminarIdInvalido.body.mensaje,
    'Identificador de usuario inválido'
  );
});

test('una cuenta suspendida no puede iniciar sesión ni reutilizar su token', async () => {
  assert.ok(tokenAdmin);
  await actualizarEstadoUsuario('suspendido');

  try {
    const login = await request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: usuarioPrueba.correo,
        password: usuarioPrueba.password,
      }),
    });

    assert.equal(login.response.status, 401);
    assert.equal(login.body.mensaje, 'Credenciales incorrectas');

    const usuarios = await request('/api/admin/usuarios', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });

    assert.equal(usuarios.response.status, 401);
    assert.equal(usuarios.body.mensaje, 'Token ausente, inválido o expirado');
  } finally {
    await actualizarEstadoUsuario('activo');
  }
});
