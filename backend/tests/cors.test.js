const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizarOrigenesCors,
  obtenerOrigenesPermitidos,
} = require('../utils/cors');

function configurarEntorno(nodeEnv, corsOrigin) {
  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = nodeEnv;
  }

  if (corsOrigin === undefined) {
    delete process.env.CORS_ORIGIN;
  } else {
    process.env.CORS_ORIGIN = corsOrigin;
  }
}

test('CORS_ORIGIN se normaliza y es obligatorio únicamente en producción', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;
  const corsOriginOriginal = process.env.CORS_ORIGIN;

  try {
    assert.deepEqual(
      normalizarOrigenesCors(
        ' https://frontend.example , http://localhost:8080, '
      ),
      ['https://frontend.example', 'http://localhost:8080']
    );

    configurarEntorno('development', undefined);
    assert.deepEqual(obtenerOrigenesPermitidos(), []);

    configurarEntorno('test', '');
    assert.deepEqual(obtenerOrigenesPermitidos(), []);

    configurarEntorno('production', undefined);
    assert.throws(
      () => obtenerOrigenesPermitidos(),
      /CORS_ORIGIN debe contener al menos un origen autorizado/
    );

    configurarEntorno('production', '   ,  ');
    assert.throws(
      () => obtenerOrigenesPermitidos(),
      /CORS_ORIGIN debe contener al menos un origen autorizado/
    );

    configurarEntorno(
      'production',
      'https://tecno85.github.io,http://localhost:8080'
    );
    assert.deepEqual(obtenerOrigenesPermitidos(), [
      'https://tecno85.github.io',
      'http://localhost:8080',
    ]);
  } finally {
    configurarEntorno(nodeEnvOriginal, corsOriginOriginal);
  }
});
