const assert = require('node:assert/strict');
const test = require('node:test');

const {
  crearContextoFrontend,
  ejecutarScript,
  evaluar,
} = require('./helpers/frontend-vm');

function crearEscenario() {
  const escenario = crearContextoFrontend();
  ejecutarScript(escenario.contexto, 'editor-image.js');
  return escenario.contexto;
}

test('valida formato y tamaño antes de cargar una imagen', () => {
  const contexto = crearEscenario();

  contexto.archivoPrueba = { type: 'image/png', size: 1024 };
  assert.deepEqual(
    evaluar(
      contexto,
      'JSON.parse(JSON.stringify(window.ArtifyEditorImage.validarArchivoImagen(archivoPrueba)))'
    ),
    { valido: true }
  );

  contexto.archivoPrueba = { type: 'image/gif', size: 1024 };
  assert.equal(
    evaluar(
      contexto,
      'window.ArtifyEditorImage.validarArchivoImagen(archivoPrueba).valido'
    ),
    false
  );

  contexto.archivoPrueba = { type: 'image/webp', size: 10 * 1024 * 1024 + 1 };
  assert.equal(
    evaluar(
      contexto,
      'window.ArtifyEditorImage.validarArchivoImagen(archivoPrueba).mensaje'
    ),
    'La imagen supera el límite de 10 MB'
  );
});

test('limita dimensiones y normaliza formatos del editor', () => {
  const contexto = crearEscenario();

  assert.equal(
    evaluar(
      contexto,
      'window.ArtifyEditorImage.validarDimensionesImagen(4000, 4000).valido'
    ),
    true
  );
  assert.equal(
    evaluar(
      contexto,
      'window.ArtifyEditorImage.validarDimensionesImagen(4001, 4000).valido'
    ),
    false
  );
  assert.equal(
    evaluar(
      contexto,
      'window.ArtifyEditorImage.validarDimensionesImagen(9000, 1).valido'
    ),
    false
  );
  assert.equal(
    evaluar(
      contexto,
      'window.ArtifyEditorImage.normalizarFormatoImagen("image/jpeg")'
    ),
    'jpeg'
  );
});
