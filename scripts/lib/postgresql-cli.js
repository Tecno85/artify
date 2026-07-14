const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ_PROYECTO = path.resolve(__dirname, '..', '..');
const RUTA_ENV_DEFECTO = path.join(RAIZ_PROYECTO, 'backend', '.env');
const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function leerArchivoEnv(ruta = RUTA_ENV_DEFECTO) {
  if (!fs.existsSync(ruta)) {
    return {};
  }

  const variables = {};
  for (const lineaOriginal of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const linea = lineaOriginal.trim();
    if (!linea || linea.startsWith('#')) continue;

    const coincidencia = linea
      .replace(/^export\s+/, '')
      .match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!coincidencia) continue;

    let valor = coincidencia[2].trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    variables[coincidencia[1]] = valor;
  }

  return variables;
}

function obtenerConfiguracionPostgresql(baseAlternativa) {
  const variables = { ...leerArchivoEnv(), ...process.env };
  const databaseUrl = variables.DATABASE_URL?.trim();

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new Error('DATABASE_URL debe usar el protocolo PostgreSQL');
    }

    return {
      host: url.hostname,
      port: url.port || '5432',
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database:
        baseAlternativa || decodeURIComponent(url.pathname.replace(/^\//, '')),
      sslmode: url.searchParams.get('sslmode') || '',
    };
  }

  return {
    host: variables.DB_HOST || 'localhost',
    port: variables.DB_PORT || '5432',
    user: variables.DB_USER || '',
    password: variables.DB_PASSWORD || '',
    database: baseAlternativa || variables.DB_NAME || '',
    sslmode: variables.PGSSLMODE || '',
  };
}

function crearEntornoPostgresql(configuracion) {
  const entorno = {
    ...process.env,
    PGHOST: configuracion.host,
    PGPORT: String(configuracion.port),
    PGUSER: configuracion.user,
    PGPASSWORD: configuracion.password,
    PGDATABASE: configuracion.database,
  };

  if (configuracion.sslmode) {
    entorno.PGSSLMODE = configuracion.sslmode;
  } else {
    delete entorno.PGSSLMODE;
  }

  return entorno;
}

function ejecutarPostgresql(
  comando,
  argumentos,
  configuracion,
  { input, permitirFallo = false } = {}
) {
  const resultado = spawnSync(comando, argumentos, {
    encoding: 'utf8',
    env: crearEntornoPostgresql(configuracion),
    input,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (resultado.error) {
    throw resultado.error;
  }

  if (resultado.status !== 0 && !permitirFallo) {
    const detalle = (resultado.stderr || resultado.stdout || '').trim();
    throw new Error(`${comando} falló${detalle ? `: ${detalle}` : ''}`);
  }

  return resultado;
}

function esHostLocal(host) {
  return HOSTS_LOCALES.has(String(host).toLowerCase());
}

function citarLiteral(valor) {
  return `'${String(valor).replace(/'/g, "''")}'`;
}

function citarIdentificador(valor) {
  return `"${String(valor).replace(/"/g, '""')}"`;
}

module.exports = {
  RAIZ_PROYECTO,
  citarIdentificador,
  citarLiteral,
  crearEntornoPostgresql,
  ejecutarPostgresql,
  esHostLocal,
  obtenerConfiguracionPostgresql,
};
