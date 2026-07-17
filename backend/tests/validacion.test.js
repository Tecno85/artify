const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizarDatosUsuario,
  normalizarPaginacion,
  validarCredenciales,
  validarEdicionUsuario,
  validarUsuario,
} = require('../utils/validacion');

test('creación y edición comparten normalización y reglas personales', () => {
  const datosNormalizados = normalizarDatosUsuario({
    nombres: '  Ana María  ',
    apellidos: '  Pérez Díaz  ',
    cedula: '  1234567890  ',
    fechaNacimiento: '1995-05-12',
    correo: '  ANA.PEREZ@EXAMPLE.COM  ',
    password: 'ClaveSegura123!',
    estado: 'activo',
  });

  assert.deepEqual(datosNormalizados, {
    nombres: 'Ana María',
    apellidos: 'Pérez Díaz',
    cedula: '1234567890',
    fechaNacimiento: '1995-05-12',
    correo: 'ana.perez@example.com',
    password: 'ClaveSegura123!',
    estado: 'activo',
  });
  assert.equal(validarUsuario(datosNormalizados), null);
  assert.equal(validarEdicionUsuario(datosNormalizados), null);
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

  const fechaMenorEdad = `${new Date().getFullYear() - 17}-01-01`;
  assert.equal(
    validarUsuario({
      ...datosNormalizados,
      fechaNacimiento: fechaMenorEdad,
    }),
    'Debes tener al menos 18 años'
  );
  assert.equal(
    validarEdicionUsuario({
      ...datosNormalizados,
      fechaNacimiento: fechaMenorEdad,
    }),
    null
  );
  assert.equal(
    validarUsuario({
      ...datosNormalizados,
      cedula: '12345678901234567890',
    }),
    null
  );
  assert.equal(
    validarUsuario({
      ...datosNormalizados,
      cedula: '123456789012345678901',
    }),
    'Ingresa una cédula válida'
  );

  const casosPersonalesInvalidos = [
    ['nombres', ' ', 'Ingresa nombres válidos'],
    ['apellidos', ' ', 'Ingresa apellidos válidos'],
    ['cedula', 'ABC123', 'Ingresa una cédula válida'],
    [
      'fechaNacimiento',
      '2026-02-30',
      'Ingresa una fecha de nacimiento válida',
    ],
  ];

  for (const [campo, valor, mensaje] of casosPersonalesInvalidos) {
    const datosInvalidos = { ...datosNormalizados, [campo]: valor };
    assert.equal(validarUsuario(datosInvalidos), mensaje);
    assert.equal(validarEdicionUsuario(datosInvalidos), mensaje);
  }
});

test('paginación aplica valores seguros y rechaza límites excesivos', () => {
  assert.deepEqual(normalizarPaginacion(undefined, undefined), {
    pagina: 1,
    limite: 5,
    offset: 0,
  });
  assert.deepEqual(normalizarPaginacion('3', '10'), {
    pagina: 3,
    limite: 10,
    offset: 20,
  });
  assert.equal(normalizarPaginacion('0', '5'), null);
  assert.equal(normalizarPaginacion('1', '21'), null);
  assert.equal(normalizarPaginacion('abc', '5'), null);
});
