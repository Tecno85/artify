const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizarDatosUsuario,
  validarCredenciales,
  validarEdicionUsuario,
  validarUsuario,
} = require('../utils/validacion');

test('creación y edición comparten normalización y reglas personales', () => {
  const datosNormalizados = normalizarDatosUsuario({
    nombres: '  Ana María  ',
    apellidos: '  Pérez Díaz  ',
    correo: '  ANA.PEREZ@EXAMPLE.COM  ',
    password: 'ClaveSegura123!',
    estado: 'activo',
  });

  assert.deepEqual(datosNormalizados, {
    nombres: 'Ana María',
    apellidos: 'Pérez Díaz',
    correo: 'ana.perez@example.com',
    password: 'ClaveSegura123!',
    estado: 'activo',
  });
  assert.equal(validarUsuario(datosNormalizados), null);
  assert.equal(validarEdicionUsuario(datosNormalizados), null);

  assert.equal(
    validarUsuario({
      nombres: 'Ana María',
      apellidos: 'Pérez Díaz',
      correo: 'ana.perez@example.com',
      password: 'ClaveSegura123!',
    }),
    null
  );
  assert.equal(
    validarCredenciales({
      correo: datosNormalizados.correo,
      password: 'aaaaaaaa',
    }),
    null
  );
  assert.equal(
    validarUsuario({ ...datosNormalizados, password: 'aaaaaaaa' }),
    'La contraseña debe tener entre 8 y 128 caracteres, una mayúscula, una minúscula y un número'
  );

  const casosPersonalesInvalidos = [
    ['nombres', ' ', 'Ingresa nombres válidos'],
    ['apellidos', ' ', 'Ingresa apellidos válidos'],
  ];

  for (const [campo, valor, mensaje] of casosPersonalesInvalidos) {
    const datosInvalidos = { ...datosNormalizados, [campo]: valor };
    assert.equal(validarUsuario(datosInvalidos), mensaje);
    assert.equal(validarEdicionUsuario(datosInvalidos), mensaje);
  }
});
