const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const estilos = path.resolve(__dirname, '..', 'assets', 'css');

function leerEstilos(nombre) {
  return fs.readFileSync(path.join(estilos, nombre), 'utf8');
}

function extraerVariable(css, nombre) {
  const coincidencia = css.match(new RegExp(`--${nombre}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert.ok(coincidencia, `No se encontró la variable --${nombre}`);
  return coincidencia[1];
}

function luminancia(hexadecimal) {
  const canales = hexadecimal
    .slice(1)
    .match(/.{2}/g)
    .map((canal) => parseInt(canal, 16) / 255)
    .map((canal) =>
      canal <= 0.04045
        ? canal / 12.92
        : Math.pow((canal + 0.055) / 1.055, 2.4)
    );

  return canales[0] * 0.2126 + canales[1] * 0.7152 + canales[2] * 0.0722;
}

function calcularContraste(primerColor, segundoColor) {
  const luminancias = [luminancia(primerColor), luminancia(segundoColor)].sort(
    (a, b) => b - a
  );

  return (luminancias[0] + 0.05) / (luminancias[1] + 0.05);
}

test('los botones principales alcanzan contraste AA con texto blanco', () => {
  const archivos = [
    ['login.css', 'action-primary'],
    ['registro.css', 'action-primary'],
    ['editor.css', 'action-primary'],
    ['admin.css', 'primary-dark'],
  ];

  for (const [archivo, variable] of archivos) {
    const color = extraerVariable(leerEstilos(archivo), variable);
    const contraste = calcularContraste(color, '#ffffff');
    assert.ok(
      contraste >= 4.5,
      `${archivo}: blanco sobre ${color} solo alcanza ${contraste.toFixed(2)}:1`
    );
  }
});

test('los mensajes de error alcanzan contraste AA sobre las superficies oscuras', () => {
  for (const archivo of ['login.css', 'registro.css', 'editor.css', 'admin.css']) {
    const css = leerEstilos(archivo);
    const error = extraerVariable(css, 'error');
    const superficie = '#161616';
    const contraste = calcularContraste(error, superficie);
    assert.ok(
      contraste >= 4.5,
      `${archivo}: ${error} sobre ${superficie} solo alcanza ${contraste.toFixed(2)}:1`
    );
  }
});

test('los estados deshabilitados del editor se distinguen sin parecer activos', () => {
  const editor = leerEstilos('editor.css');

  assert.match(editor, /\.tool-btn:disabled\s*{[\s\S]*?opacity:\s*0\.6/);
  assert.match(
    editor,
    /\.btn-apply:disabled\s*{[\s\S]*?background:\s*#343434/
  );
});
