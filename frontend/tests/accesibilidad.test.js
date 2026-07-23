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

test('errores y notificaciones dinámicas se anuncian sin controles engañosos', () => {
  const login = leerPagina('login.html');
  const registro = leerPagina('registro.html');
  const admin = leerPagina('admin.html');
  const editor = leerPagina('editor.html');
  const editorScript = fs.readFileSync(path.join(scripts, 'editor.js'), 'utf8');

  assert.match(login, /id="email-error"[\s\S]*?aria-live="polite"/);
  assert.match(login, /id="password-error"[\s\S]*?aria-live="polite"/);
  assert.doesNotMatch(login, /Recuperación de contraseña no disponible/);
  assert.match(
    registro,
    /href="\.\/terminos\.html"[\s\S]*?target="_blank"[\s\S]*?rel="noopener noreferrer"/
  );
  assert.doesNotMatch(registro, /href="#"[^>]*>términos y condiciones/);
  assert.match(
    admin,
    /id="adminNotificacion"[\s\S]*?role="status"[\s\S]*?aria-live="polite"/
  );
  assert.match(
    editor,
    /<output[\s\S]*?id="filterIntensityValue"[\s\S]*?for="filterIntensity"/
  );
  assert.match(
    editor,
    /id="filterStatus"[\s\S]*?role="status"[\s\S]*?aria-live="polite"/
  );
  assert.match(
    editor,
    /id="operationsCount"[\s\S]*?role="status"[\s\S]*?aria-live="polite"/
  );
  assert.match(editorScript, /container\.setAttribute\('role', 'status'\)/);
});

test('el registro y la administración solicitan solo los datos necesarios', () => {
  const registro = leerPagina('registro.html');
  const administracion = leerPagina('admin.html');
  const registroScript = fs.readFileSync(path.join(scripts, 'registro.js'), 'utf8');
  const administracionScript = fs.readFileSync(path.join(scripts, 'admin.js'), 'utf8');

  for (const campo of [
    'nombres',
    'apellidos',
    'email',
    'password',
    'confirmPassword',
    'terminos',
  ]) {
    assert.match(registro, new RegExp(`id="${campo}"`));
  }

  assert.doesNotMatch(registro, /id="cedula"|id="fechaNacimiento"/);
  assert.doesNotMatch(registro, /id="btnCancelar"/);
  assert.doesNotMatch(registroScript, /cedula|fechaNacimiento/);
  assert.doesNotMatch(administracion, /modalCedula|modalFechaNac/);
  assert.doesNotMatch(administracionScript, /cedula|fechaNacimiento/);
});
