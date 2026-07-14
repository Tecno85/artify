const { expect, test } = require('@playwright/test');

const IMAGEN_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

test('carga, confirma un filtro, actualiza historial y descarga la imagen', async ({
  page,
}) => {
  await page.route('http://127.0.0.1:3000/**', async (route) => {
    const url = new URL(route.request().url());
    let body = { mensaje: 'ok' };

    if (url.pathname === '/api/sesion/iniciar') {
      body = { mensaje: 'Sesión iniciada', idSesion: 91 };
    } else if (url.pathname === '/api/configuracion/7') {
      body = {
        mensaje: 'ok',
        configuracion: {
          calidadExportacion: 'alta',
          notificacionesHabilitadas: true,
          formatoDefecto: 'png',
          autoguardado: false,
        },
      };
    } else if (url.pathname === '/api/admin/usuarios') {
      body = { mensaje: 'ok', usuarios: [] };
    }

    await route.fulfill({ json: body });
  });

  await page.addInitScript(() => {
    if (!sessionStorage.getItem('artifyToken')) {
      sessionStorage.setItem('artifyToken', 'token-e2e');
    }
    if (!sessionStorage.getItem('artifyUser')) {
      sessionStorage.setItem(
        'artifyUser',
        JSON.stringify({
          id: 7,
          nombres: 'Usuario',
          apellidos: 'E2E',
          correo: 'e2e@artify.local',
          rol: 'usuario',
        })
      );
    }
  });

  await page.goto('/pages/editor.html');
  await expect(page.locator('#userName')).toHaveText('Usuario E2E');

  const btnConfig = page.locator('#btnConfig');
  await btnConfig.click();
  await expect(page.locator('#modalConfiguracion')).toBeVisible();
  await expect(page.locator('#btnCerrarConfig')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modalConfiguracion')).toBeHidden();
  await expect(btnConfig).toBeFocused();

  await page.locator('#fileInput').setInputFiles({
    name: 'prueba-e2e.png',
    mimeType: 'image/png',
    buffer: IMAGEN_PNG,
  });

  await expect(page.locator('#operationsCount')).toHaveText('1 operaciones');
  await expect(page.locator('#btnDescargar')).toBeEnabled();

  await page.locator('#btnFiltros').click();
  const filtro = page.locator('[data-filter="grayscale"]');
  await filtro.click();
  await expect(filtro).toHaveAttribute('aria-pressed', 'true');

  const intensidad = page.locator('#filterIntensity');
  await intensidad.evaluate((slider) => {
    slider.value = '70';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect(page.locator('#filterIntensityValue')).toHaveText('70%');
  await expect(page.locator('#btnAplicarFiltro')).toBeEnabled();
  await expect(page.locator('#operationsCount')).toHaveText('1 operaciones');

  await page.locator('#btnAplicarFiltro').click();
  await expect(page.locator('#operationsCount')).toHaveText('2 operaciones');
  await expect(filtro).toHaveAttribute('aria-pressed', 'false');

  const descargaPendiente = page.waitForEvent('download');
  await page.locator('#btnDescargar').click();
  const descarga = await descargaPendiente;
  expect(descarga.suggestedFilename()).toMatch(/^artify-editado-\d+\.png$/);

  await page.evaluate(() => {
    sessionStorage.setItem(
      'artifyUser',
      JSON.stringify({
        id: 7,
        nombres: 'Administrador',
        apellidos: 'E2E',
        correo: 'admin.e2e@artify.local',
        rol: 'admin',
      })
    );
  });
  await page.goto('/pages/admin.html');

  const btnAgregarUsuario = page.locator('#btnAgregarUsuario');
  await btnAgregarUsuario.click();
  await expect(page.locator('#modalUsuario')).toBeVisible();
  await expect(page.locator('#modalNombres')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modalUsuario')).toBeHidden();
  await expect(btnAgregarUsuario).toBeFocused();
});
