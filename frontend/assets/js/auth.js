// ========== CONFIGURACIÓN ==========
const API =
  window.ARTIFY_API_URL ||
  (window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000');

// ========== TOKEN Y SESIÓN ==========
const CLAVES_AUTH = ['artifyAdmin', 'artifyUser', 'artifyToken'];

function obtenerValorAuth(clave) {
  return sessionStorage.getItem(clave) || localStorage.getItem(clave);
}

function obtenerTokenAuth() {
  return obtenerValorAuth('artifyToken');
}

function obtenerUsuarioAuth() {
  const usuarioGuardado = obtenerValorAuth('artifyUser');

  if (!usuarioGuardado) {
    return null;
  }

  try {
    return JSON.parse(usuarioGuardado);
  } catch {
    sessionStorage.removeItem('artifyUser');
    localStorage.removeItem('artifyUser');
    return null;
  }
}

function limpiarCredencialesAuth() {
  CLAVES_AUTH.forEach((clave) => {
    sessionStorage.removeItem(clave);
    localStorage.removeItem(clave);
  });
}

function guardarSesionAuth(token, usuario, recordar = false) {
  if (!token || !usuario) {
    return false;
  }

  limpiarCredencialesAuth();
  const almacenamiento = recordar ? localStorage : sessionStorage;
  almacenamiento.setItem('artifyToken', token);
  almacenamiento.setItem('artifyUser', JSON.stringify(usuario));
  return true;
}

function guardarTokenAuth(token, recordar = false) {
  if (!token) {
    return false;
  }

  sessionStorage.removeItem('artifyToken');
  localStorage.removeItem('artifyToken');
  const almacenamiento = recordar ? localStorage : sessionStorage;
  almacenamiento.setItem('artifyToken', token);
  return true;
}

function limpiarSesionAuth() {
  limpiarCredencialesAuth();
  sessionStorage.removeItem('artifyIdSesion');
  localStorage.removeItem('artify_backup_v1');
  localStorage.removeItem('artify_backup_image');
  localStorage.removeItem('artify_backup_timestamp');
}

// ========== HEADERS DE AUTENTICACIÓN ==========
function construirHeadersAuth(headers = {}) {
  const token = obtenerTokenAuth();
  const resultado = { ...headers };

  if (token) {
    resultado.Authorization = `Bearer ${token}`;
  }

  return resultado;
}

// ========== FETCH PROTEGIDO ==========
// Adjuntar el token y limpiar sesión cuando el backend responde 401
async function fetchAuth(url, options = {}) {
  const optionsFinales = { ...options };
  optionsFinales.headers = construirHeadersAuth(options.headers || {});

  const response = await fetch(url, optionsFinales);

  if (response.status === 401) {
    limpiarSesionAuth();

    const paginaActual = window.location.pathname.split('/').pop();
    if (!['login.html', 'registro.html'].includes(paginaActual)) {
      window.location.replace('./login.html');
    }
  }

  return response;
}
