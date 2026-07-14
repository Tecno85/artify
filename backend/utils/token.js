// ========== DEPENDENCIAS ==========
const crypto = require('crypto');

// ========== CONFIGURACIÓN ==========
const TOKEN_EXPIRACION_SEGUNDOS = 8 * 60 * 60;
const TOKEN_SECRET_DESARROLLO = crypto.randomBytes(32).toString('hex');
const LONGITUD_MINIMA_SECRETO = 32;
const VALORES_SECRETOS_DE_EJEMPLO = [
  'cambia_este_valor',
  'reemplazar_',
  'pega_aqui_',
  'secreto_largo_aleatorio_y_privado',
  'change_me',
  'changeme',
  'your_secret',
];
let secretoTemporalAvisado = false;

// ========== UTILIDADES BASE64 ==========
function obtenerProblemaSecreto(secreto) {
  if (!secreto) {
    return 'TOKEN_SECRET no está configurado';
  }

  if (secreto.length < LONGITUD_MINIMA_SECRETO) {
    return `TOKEN_SECRET debe tener al menos ${LONGITUD_MINIMA_SECRETO} caracteres`;
  }

  const secretoNormalizado = secreto.toLowerCase();
  if (
    VALORES_SECRETOS_DE_EJEMPLO.some((valor) =>
      secretoNormalizado.includes(valor)
    )
  ) {
    return 'TOKEN_SECRET conserva un valor de ejemplo y debe reemplazarse';
  }

  return null;
}

function obtenerSecreto() {
  const secretoConfigurado = (process.env.TOKEN_SECRET || '').trim();
  const problema = obtenerProblemaSecreto(secretoConfigurado);

  if (!problema) {
    return secretoConfigurado;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(problema);
  }

  if (!secretoTemporalAvisado) {
    console.warn(
      `⚠️ ${problema}. Usando secreto temporal de desarrollo.`
    );
    secretoTemporalAvisado = true;
  }

  return TOKEN_SECRET_DESARROLLO;
}

function validarConfiguracionToken() {
  return obtenerSecreto();
}

function base64UrlEncode(valor) {
  return Buffer.from(valor)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(valor) {
  const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (base64.length % 4 || 4);
  return Buffer.from(base64 + '='.repeat(padding), 'base64').toString('utf8');
}

function firmar(valor) {
  return crypto
    .createHmac('sha256', obtenerSecreto())
    .update(valor)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function firmasCoinciden(firmaRecibida, firmaEsperada) {
  const recibida = Buffer.from(firmaRecibida);
  const esperada = Buffer.from(firmaEsperada);

  return (
    recibida.length === esperada.length &&
    crypto.timingSafeEqual(recibida, esperada)
  );
}

// ========== FIRMA Y VALIDACIÓN DE TOKEN ==========
// Crear un token firmado con expiración embebida para autenticación sin sesiones
function crearToken(payload) {
  const ahora = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    exp: ahora + TOKEN_EXPIRACION_SEGUNDOS,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(tokenPayload));
  const firma = firmar(`${header}.${body}`);

  return `${header}.${body}.${firma}`;
}

// Validar formato, firma y expiración del token recibido desde el cliente
function verificarToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('TOKEN_AUSENTE');
  }

  const partes = token.split('.');
  if (partes.length !== 3) {
    throw new Error('TOKEN_INVALIDO');
  }

  const [header, body, firma] = partes;
  const firmaEsperada = firmar(`${header}.${body}`);

  if (!firmasCoinciden(firma, firmaEsperada)) {
    throw new Error('TOKEN_INVALIDO');
  }

  const payload = JSON.parse(base64UrlDecode(body));
  const ahora = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < ahora) {
    throw new Error('TOKEN_EXPIRADO');
  }

  return payload;
}

// ========== EXPORTACIÓN ==========
module.exports = {
  crearToken,
  verificarToken,
  validarConfiguracionToken,
};
