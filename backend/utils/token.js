// ========== DEPENDENCIAS ==========
const crypto = require('crypto');

// ========== CONFIGURACIÓN ==========
const TOKEN_EXPIRACION_SEGUNDOS = 8 * 60 * 60;
const TOKEN_SECRET_DESARROLLO = crypto.randomBytes(32).toString('hex');
let secretoTemporalAvisado = false;

// ========== UTILIDADES BASE64 ==========
function obtenerSecreto() {
  if (process.env.TOKEN_SECRET) {
    return process.env.TOKEN_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('TOKEN_SECRET no está configurado');
  }

  if (!secretoTemporalAvisado) {
    console.warn(
      '⚠️ TOKEN_SECRET no está configurado. Usando secreto temporal de desarrollo.'
    );
    secretoTemporalAvisado = true;
  }

  return TOKEN_SECRET_DESARROLLO;
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

  if (firma !== firmaEsperada) {
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
};
