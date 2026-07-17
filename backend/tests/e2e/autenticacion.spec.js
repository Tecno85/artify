const { expect, test } = require('@playwright/test');

async function prepararApi(page, usuario) {
  await page.route('http://127.0.0.1:3000/**', async (route) => {
    const url = new URL(route.request().url());
    let body = { mensaje: 'ok' };

    if (url.pathname === '/api/login') {
      body = {
        mensaje: 'Login exitoso',
        token: `token-${usuario.rol}`,
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

async function iniciarSesion(page, usuario) {
  await prepararApi(page, usuario);
  await page.goto('/pages/login.html');
  await page.locator('#email').fill(usuario.correo);
  await page.locator('#password').fill('ClaveSegura1');
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
    .toEqual({ token: 'token-usuario', usuario });
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
    .toBe('token-admin');
});
