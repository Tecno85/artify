// ========== CONFIGURACIÓN ==========
const API =
  window.ARTIFY_API_URL ||
  (window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000');

// ========== TOKEN Y SESIÓN ==========
function obtenerTokenAuth() {
  return sessionStorage.getItem('artifyToken');
}

function guardarTokenAuth(token) {
  if (token) {
    sessionStorage.setItem('artifyToken', token);
  }
}

function limpiarSesionAuth() {
  sessionStorage.removeItem('artifyAdmin');
  sessionStorage.removeItem('artifyUser');
  sessionStorage.removeItem('artifyToken');
  sessionStorage.removeItem('artifyIdSesion');
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
  }

  return response;
}
