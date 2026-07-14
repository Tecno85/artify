const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizarDatosUsuario,
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
