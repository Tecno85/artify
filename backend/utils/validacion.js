// ========== VALIDACIONES COMPARTIDAS ==========
function esTexto(valor, minimo = 1, maximo = 255) {
  return (
    typeof valor === 'string' &&
    valor.trim().length >= minimo &&
    valor.trim().length <= maximo
  );
}

function esCorreo(valor) {
  return esTexto(valor, 5, 150) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function esPassword(valor) {
  return typeof valor === 'string' && valor.length >= 8 && valor.length <= 128;
}

function esCedula(valor) {
  return esTexto(valor, 6, 20) && /^[0-9]+$/.test(valor);
}

function esFecha(valor) {
  return typeof valor === 'string' && !Number.isNaN(Date.parse(valor));
}

function normalizarIdEntero(valor) {
  if (typeof valor === 'number' && Number.isSafeInteger(valor) && valor > 0) {
    return valor;
  }

  if (typeof valor === 'string' && /^[1-9][0-9]*$/.test(valor)) {
    const numero = Number(valor);
    return Number.isSafeInteger(numero) ? numero : null;
  }

  return null;
}

function validarCredenciales({ correo, password }) {
  if (!esCorreo(correo)) {
    return 'Ingresa un correo válido';
  }

  if (!esPassword(password)) {
    return 'La contraseña debe tener entre 8 y 128 caracteres';
  }

  return null;
}

function validarCredencialesAdmin({ correo, password }) {
  if (!esCorreo(correo)) {
    return 'Ingresa un correo válido';
  }

  if (typeof password !== 'string' || password.length === 0) {
    return 'Ingresa la contraseña';
  }

  return null;
}

function validarUsuario({
  nombres,
  apellidos,
  cedula,
  fechaNacimiento,
  correo,
  password,
}) {
  if (!esTexto(nombres, 2, 100)) {
    return 'Ingresa nombres válidos';
  }

  if (!esTexto(apellidos, 2, 100)) {
    return 'Ingresa apellidos válidos';
  }

  if (!esCedula(cedula)) {
    return 'Ingresa una cédula válida';
  }

  if (!esFecha(fechaNacimiento)) {
    return 'Ingresa una fecha de nacimiento válida';
  }

  const errorCredenciales = validarCredenciales({ correo, password });
  if (errorCredenciales) {
    return errorCredenciales;
  }

  return null;
}

function validarEdicionUsuario({
  nombres,
  apellidos,
  cedula,
  fechaNacimiento,
  correo,
  estado,
}) {
  if (!esTexto(nombres, 2, 100)) {
    return 'Ingresa nombres válidos';
  }

  if (!esTexto(apellidos, 2, 100)) {
    return 'Ingresa apellidos válidos';
  }

  if (!esCedula(cedula)) {
    return 'Ingresa una cédula válida';
  }

  if (!esFecha(fechaNacimiento)) {
    return 'Ingresa una fecha de nacimiento válida';
  }

  if (!esCorreo(correo)) {
    return 'Ingresa un correo válido';
  }

  if (!['activo', 'inactivo', 'suspendido'].includes(estado)) {
    return 'Selecciona un estado válido';
  }

  return null;
}

module.exports = {
  normalizarIdEntero,
  validarCredenciales,
  validarCredencialesAdmin,
  validarUsuario,
  validarEdicionUsuario,
};
