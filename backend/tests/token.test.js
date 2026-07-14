const assert = require('node:assert/strict');
const test = require('node:test');

const { validarConfiguracionToken } = require('../utils/token');

function configurarEntorno(nodeEnv, tokenSecret) {
  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = nodeEnv;
  }

  if (tokenSecret === undefined) {
    delete process.env.TOKEN_SECRET;
    return;
  }

  process.env.TOKEN_SECRET = tokenSecret;
}

test('TOKEN_SECRET se valida según el entorno antes de iniciar el backend', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;
  const tokenSecretOriginal = process.env.TOKEN_SECRET;
  const consoleWarnOriginal = console.warn;
  console.warn = () => {};

  try {
    configurarEntorno('development', undefined);
    assert.match(validarConfiguracionToken(), /^[a-f0-9]{64}$/);

    configurarEntorno('production', undefined);
    assert.throws(
      () => validarConfiguracionToken(),
      /TOKEN_SECRET no está configurado/
    );

    configurarEntorno('production', 'secreto-corto');
    assert.throws(
      () => validarConfiguracionToken(),
      /al menos 32 caracteres/
    );

    configurarEntorno(
      'production',
      'cambia_este_valor_por_un_secreto_largo_y_aleatorio'
    );
    assert.throws(
      () => validarConfiguracionToken(),
      /conserva un valor de ejemplo/
    );

    configurarEntorno(
      'production',
      'PEGA_AQUI_LOS_64_CARACTERES_GENERADOS_PARA_ARTIFY'
    );
    assert.throws(
      () => validarConfiguracionToken(),
      /conserva un valor de ejemplo/
    );

    const secretoSeguro = 'artify-produccion-2026-secreto-aleatorio-privado';
    configurarEntorno('production', secretoSeguro);
    assert.equal(validarConfiguracionToken(), secretoSeguro);
  } finally {
    console.warn = consoleWarnOriginal;
    configurarEntorno(nodeEnvOriginal, tokenSecretOriginal);
  }
});
