const { expect, test } = require('@playwright/test');

function crearTokenPrueba(usuario) {
  const payload = Buffer.from(
    JSON.stringify({
      id: usuario.id,
      rol: usuario.rol,
      exp: 4_102_444_800,
    })
  ).toString('base64url');

  return `e30.${payload}.firma-prueba`;
}

async function prepararApi(page, usuario) {
  await page.route('http://127.0.0.1:3000/**', async (route) => {
    const url = new URL(route.request().url());
    let body = { mensaje: 'ok' };

    if (url.pathname === '/api/login') {
      body = {
        mensaje: 'Login exitoso',
        token: crearTokenPrueba(usuario),
        usuario,
      };
    } else if (url.pathname === '/api/sesion/iniciar') {
      body = { mensaje: 'Sesión iniciada', idSesion: 101 };
    } else if (url.pathname.startsWith('/api/configuracion/')) {
      body = { mensaje: 'ok', configuracion: null };
    } else if (url.pathname === '/api/admin/usuarios') {
      body = { mensaje: 'ok', usuarios: [] };
    }

    await route.fulfill({ json: body });
  });
}

async function iniciarSesion(page, usuario, recordar = false) {
  await prepararApi(page, usuario);
  await page.goto('/pages/login.html');
  await page.locator('#email').fill(usuario.correo);
  await page.locator('#password').fill('ClaveSegura1');
  if (recordar) {
    await page.locator('#remember').check();
  }
  await page.locator('#loginForm button[type="submit"]').click();
}

test('usuario inicia sesión, conserva el token y entra al editor', async ({
  page,
}) => {
  const usuario = {
    id: 7,
    nombres: 'Usuario',
    apellidos: 'E2E',
    correo: 'usuario.e2e@artify.local',
    rol: 'usuario',
  };

  await iniciarSesion(page, usuario);
  await page.waitForURL('**/pages/editor.html');

  await expect(page.locator('#userName')).toHaveText('Usuario E2E');
  await expect
    .poll(() =>
      page.evaluate(() => ({
        token: sessionStorage.getItem('artifyToken'),
        usuario: JSON.parse(sessionStorage.getItem('artifyUser')),
      }))
    )
    .toEqual({ token: crearTokenPrueba(usuario), usuario });
});

test('administrador inicia sesión y entra al panel administrativo', async ({
  page,
}) => {
  const usuario = {
    id: 1,
    nombres: 'Administrador',
    apellidos: 'E2E',
    correo: 'admin.e2e@artify.local',
    rol: 'admin',
  };

  await iniciarSesion(page, usuario);
  await page.waitForURL('**/pages/admin.html');

  await expect(page.locator('#adminName')).toContainText('Administrador');
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('artifyToken')))
    .toBe(crearTokenPrueba(usuario));
});

test('recordar sesión mantiene el acceso al abrir el editor en otra pestaña', async ({
  context,
  page,
}) => {
  const usuario = {
    id: 12,
    nombres: 'Usuario',
    apellidos: 'Recordado',
    correo: 'recordado.e2e@artify.local',
    rol: 'usuario',
  };

  await iniciarSesion(page, usuario, true);
  await page.waitForURL('**/pages/editor.html');

  const nuevaPagina = await context.newPage();
  await prepararApi(nuevaPagina, usuario);
  await nuevaPagina.goto('/');
  await nuevaPagina.waitForURL('**/pages/editor.html');

  await expect(nuevaPagina.locator('#userName')).toHaveText(
    'Usuario Recordado'
  );
  await nuevaPagina.close();
});
