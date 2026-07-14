const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const paginas = path.resolve(__dirname, '..', 'pages');
const scripts = path.resolve(__dirname, '..', 'assets', 'js');

function leerPagina(nombre) {
  return fs.readFileSync(path.join(paginas, nombre), 'utf8');
}

test('los modales principales exponen semántica accesible', () => {
  const editor = leerPagina('editor.html');
  const admin = leerPagina('admin.html');
  const modal = fs.readFileSync(path.join(scripts, 'modal.js'), 'utf8');

  for (const id of [
    'modalResolucion',
    'modalRecuperacion',
    'modalConfiguracion',
    'modalPerfil',
    'modalConfirmarLogout',
  ]) {
    assert.match(
      editor,
      new RegExp(`id="${id}"[\\s\\S]*?role="dialog"[\\s\\S]*?aria-modal="true"`)
    );
  }

  for (const id of ['modalUsuario', 'modalEliminar']) {
    assert.match(
      admin,
      new RegExp(`id="${id}"[\\s\\S]*?role="dialog"[\\s\\S]*?aria-modal="true"`)
    );
  }

  assert.match(editor, /src="\.\.\/assets\/js\/modal\.js"/);
  assert.match(admin, /src="\.\.\/assets\/js\/modal\.js"/);
  assert.match(modal, /evento\.key === 'Escape'/);
  assert.match(modal, /evento\.key !== 'Tab'/);
  assert.match(modal, /focosAnteriores/);
  assert.match(modal, /focoPrevio\.focus\(\)/);
});

test('errores y notificaciones dinámicas se anuncian sin enlaces falsos', () => {
  const login = leerPagina('login.html');
  const admin = leerPagina('admin.html');

  assert.match(login, /id="email-error"[\s\S]*?aria-live="polite"/);
  assert.match(login, /id="password-error"[\s\S]*?aria-live="polite"/);
  assert.match(login, /Recuperación de contraseña no disponible/);
  assert.doesNotMatch(login, /href="#"[^>]*>\s*¿Olvidaste tu contraseña/);
  assert.match(
    admin,
    /id="adminNotificacion"[\s\S]*?role="status"[\s\S]*?aria-live="polite"/
  );
});
