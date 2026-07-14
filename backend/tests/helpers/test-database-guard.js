const NOMBRE_BASE_PRUEBAS = /_test$/i;
const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function crearErrorSeguridad(mensaje) {
  return new Error(`Pruebas bloqueadas por seguridad: ${mensaje}`);
}

function obtenerDestinoBaseDatos(env) {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (databaseUrl) {
    let url;

    try {
      url = new URL(databaseUrl);
    } catch {
      throw crearErrorSeguridad('DATABASE_URL no es una URL PostgreSQL válida.');
    }

    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw crearErrorSeguridad('DATABASE_URL debe usar el protocolo PostgreSQL.');
    }

    return {
      nombre: decodeURIComponent(url.pathname.replace(/^\/+/, '')).trim(),
      host: url.hostname.toLowerCase(),
    };
  }

  return {
    nombre: env.DB_NAME?.trim() || '',
    host: (env.DB_HOST?.trim() || 'localhost').toLowerCase(),
  };
}

function validarBaseDatosPruebas(env = process.env) {
  if (env.NODE_ENV !== 'test') {
    throw crearErrorSeguridad('NODE_ENV debe ser exactamente "test".');
  }

  if (env.ALLOW_TEST_DB_MUTATIONS !== 'true') {
    throw crearErrorSeguridad(
      'define ALLOW_TEST_DB_MUTATIONS=true para confirmar las mutaciones temporales.'
    );
  }

  const destino = obtenerDestinoBaseDatos(env);

  if (!NOMBRE_BASE_PRUEBAS.test(destino.nombre)) {
    throw crearErrorSeguridad(
      'la base de datos debe tener un nombre terminado en "_test".'
    );
  }

  if (
    !HOSTS_LOCALES.has(destino.host) &&
    env.ALLOW_REMOTE_TEST_DATABASE !== 'true'
  ) {
    throw crearErrorSeguridad(
      'el host es remoto; usa una base local o confirma una base remota exclusiva con ALLOW_REMOTE_TEST_DATABASE=true.'
    );
  }

  return destino;
}

module.exports = { validarBaseDatosPruebas };
