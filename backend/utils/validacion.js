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

function normalizarCorreo(valor) {
  return typeof valor === 'string' ? valor.trim().toLowerCase() : valor;
}

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : valor;
}

function normalizarDatosUsuario(datos = {}) {
  return {
    nombres: normalizarTexto(datos.nombres),
    apellidos: normalizarTexto(datos.apellidos),
    correo: normalizarCorreo(datos.correo),
    password: datos.password,
    estado: datos.estado,
  };
}

function esPassword(valor) {
  return typeof valor === 'string' && valor.length >= 8 && valor.length <= 128;
}

function esPasswordNuevaSegura(valor) {
  return (
    esPassword(valor) &&
    /[a-z]/.test(valor) &&
    /[A-Z]/.test(valor) &&
    /[0-9]/.test(valor)
  );
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
  if (!esCorreo(normalizarCorreo(correo))) {
    return 'Ingresa un correo válido';
  }

  if (!esPassword(password)) {
    return 'La contraseña debe tener entre 8 y 128 caracteres';
  }

  return null;
}

function validarDatosPersonales({ nombres, apellidos }) {
  if (!esTexto(nombres, 2, 100)) {
    return 'Ingresa nombres válidos';
  }

  if (!esTexto(apellidos, 2, 100)) {
    return 'Ingresa apellidos válidos';
  }

  return null;
}

function validarUsuario({
  nombres,
  apellidos,
  correo,
  password,
}) {
  const errorDatosPersonales = validarDatosPersonales({ nombres, apellidos });
  if (errorDatosPersonales) {
    return errorDatosPersonales;
  }

  if (!esCorreo(normalizarCorreo(correo))) {
    return 'Ingresa un correo válido';
  }

  if (!esPasswordNuevaSegura(password)) {
    return 'La contraseña debe tener entre 8 y 128 caracteres, una mayúscula, una minúscula y un número';
  }

  return null;
}

function validarEdicionUsuario({
  nombres,
  apellidos,
  correo,
  estado,
}) {
  const errorDatosPersonales = validarDatosPersonales({
    nombres,
    apellidos,
  });
  if (errorDatosPersonales) {
    return errorDatosPersonales;
  }

  if (!esCorreo(correo)) {
    return 'Ingresa un correo válido';
  }

  if (!['activo', 'inactivo', 'suspendido'].includes(estado)) {
    return 'Selecciona un estado válido';
  }

  return null;
}

function validarConfiguracion({
  calidadExportacion,
  notificaciones,
  formatoDefecto,
  autoguardado,
}) {
  if (!['baja', 'media', 'alta'].includes(calidadExportacion)) {
    return 'Selecciona una calidad de exportación válida';
  }

  if (!['png', 'jpeg', 'webp'].includes(formatoDefecto)) {
    return 'Selecciona un formato por defecto válido';
  }

  if (typeof notificaciones !== 'boolean' || typeof autoguardado !== 'boolean') {
    return 'Las preferencias booleanas son inválidas';
  }

  return null;
}

module.exports = {
  normalizarCorreo,
  normalizarDatosUsuario,
  normalizarIdEntero,
  validarConfiguracion,
  validarCredenciales,
  validarUsuario,
  validarEdicionUsuario,
};
