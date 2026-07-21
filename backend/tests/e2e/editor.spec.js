const { expect, test } = require('@playwright/test');

const IMAGEN_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGM4kWL0HwAFtAJeHzr7ywAAAABJRU5ErkJggg==',
  'base64'
);

test('carga, cancela y confirma filtros, actualiza historial y descarga', async ({
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
    } else if (url.pathname === '/api/estadisticas/7') {
      body = {
        mensaje: 'ok',
        estadisticas: {
          sesiones: 2,
          operaciones: 6,
          imagenesEditadas: 1,
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

  await page.locator('#btnPerfil').click();
  await expect(page.locator('#perfilOperaciones')).toHaveText('6');
  await expect(page.locator('#perfilOperacionesLabel')).toHaveText(
    'Operaciones registradas'
  );
  await expect(page.locator('#modalPerfil')).not.toContainText(
    'Historial de operaciones'
  );
  await page.locator('#btnCerrarPerfil').click();

  await page.locator('#fileInput').setInputFiles({
    name: 'prueba-e2e.png',
    mimeType: 'image/png',
    buffer: IMAGEN_PNG,
  });

  await expect(page.locator('#operationsCount')).toHaveText('Sin cambios');
  await expect(page.locator('#btnDescargar')).toBeEnabled();

  const leerPixel = () =>
    page.locator('#mainCanvas').evaluate((canvas) =>
      Array.from(canvas.getContext('2d').getImageData(0, 0, 1, 1).data)
    );
  await expect.poll(leerPixel).toEqual([200, 100, 50, 255]);

  await page.locator('#btnFiltros').click();
  const filtro = page.locator('[data-filter="grayscale"]');
  await filtro.click();
  await expect(filtro).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#toolControls')).toBeHidden();
  await expect(page.locator('#btnCancelarFiltro')).toHaveText('Cerrar');

  const intensidad = page.locator('#filterIntensity');
  await intensidad.evaluate((slider) => {
    slider.value = '70';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await expect(page.locator('#filterIntensityValue')).toHaveText('70%');
  await expect(page.locator('#btnAplicarFiltro')).toBeEnabled();
  await expect(page.locator('#btnCancelarFiltro')).toHaveText(
    'Cancelar cambios'
  );
  await expect(page.locator('#filterStatus')).toHaveText(
    'Vista previa pendiente'
  );
  await expect(page.locator('#operationsCount')).toHaveText('Sin cambios');

  await page.locator('#btnCancelarFiltro').click();
  await expect(page.locator('#filterControls')).toBeVisible();
  await expect(filtro).toHaveAttribute('aria-pressed', 'true');
  await expect(intensidad).toHaveValue('0');
  await expect(page.locator('#btnAplicarFiltro')).toBeDisabled();
  await expect(page.locator('#btnCancelarFiltro')).toHaveText('Cerrar');
  await expect(page.locator('#operationsCount')).toHaveText('Sin cambios');

  await intensidad.evaluate((slider) => {
    slider.value = '70';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.locator('#btnAplicarFiltro').click();
  await expect(page.locator('#operationsCount')).toHaveText(
    '1 cambio aplicado'
  );
  await expect.poll(leerPixel).toEqual([147, 117, 102, 255]);
  await expect(page.locator('#filterControls')).toBeVisible();
  await expect(filtro).toHaveAttribute('aria-pressed', 'true');
  await expect(intensidad).toHaveValue('70');
  await expect(page.locator('#btnAplicarFiltro')).toBeDisabled();
  await expect(page.locator('#btnCancelarFiltro')).toHaveText('Cerrar');
  await expect(page.locator('#filterStatus')).toHaveText(
    'Blanco y Negro aplicado al 70%'
  );

  await intensidad.evaluate((slider) => {
    slider.value = '40';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(leerPixel).toEqual([170, 110, 80, 255]);
  await expect(page.locator('#btnCancelarFiltro')).toHaveText(
    'Cancelar cambios'
  );
  await page.locator('#btnCancelarFiltro').click();
  await expect(intensidad).toHaveValue('70');
  await expect.poll(leerPixel).toEqual([147, 117, 102, 255]);
  await expect(page.locator('#operationsCount')).toHaveText(
    '1 cambio aplicado'
  );

  await intensidad.evaluate((slider) => {
    slider.value = '40';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#btnAplicarFiltro').click();
  await expect(page.locator('#operationsCount')).toHaveText(
    '2 cambios aplicados'
  );
  await expect.poll(leerPixel).toEqual([170, 110, 80, 255]);
  await expect(intensidad).toHaveValue('40');
  await expect(page.locator('#filterStatus')).toHaveText(
    'Blanco y Negro aplicado al 40%'
  );

  await page.locator('#btnCancelarFiltro').click();
  await expect(page.locator('#filterControls')).toBeHidden();
  await expect(page.locator('#toolControls')).toBeVisible();
  await expect(filtro).toHaveAttribute('aria-pressed', 'false');

  await page.locator('#btnDeshacer').click();
  await expect(page.locator('#operationsCount')).toHaveText(
    '1 cambio aplicado'
  );
  await expect.poll(leerPixel).toEqual([147, 117, 102, 255]);

  await page.locator('#btnRehacer').click();
  await expect(page.locator('#operationsCount')).toHaveText(
    '2 cambios aplicados'
  );
  await expect.poll(leerPixel).toEqual([170, 110, 80, 255]);

  const descargaPendiente = page.waitForEvent('download');
  await page.locator('#btnDescargar').click();
  const descarga = await descargaPendiente;
  expect(descarga.suggestedFilename()).toMatch(/^artify-editado-\d+\.png$/);
  await expect(page.locator('#operationsCount')).toHaveText(
    '2 cambios aplicados'
  );

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
