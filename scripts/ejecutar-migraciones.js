#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  RAIZ_PROYECTO,
  citarLiteral,
  ejecutarPostgresql,
  esHostLocal,
  obtenerConfiguracionPostgresql,
} = require('./lib/postgresql-cli');

const DIRECTORIO_MIGRACIONES = path.join(
  RAIZ_PROYECTO,
  'database',
  'postgresql',
  'migrations'
);
const aplicar = process.argv.includes('--apply');

function listarMigraciones() {
  return fs
    .readdirSync(DIRECTORIO_MIGRACIONES)
    .filter((nombre) => /^\d{8}_\d{3}_[a-z0-9_]+\.sql$/.test(nombre))
    .sort();
}

function describir(nombre) {
  return nombre
    .replace(/\.sql$/, '')
    .replace(/^\d{8}_\d{3}_/, '')
    .replace(/_/g, ' ');
}

function consultarVersionesAplicadas(configuracion) {
  const consulta = `
    SELECT CASE
      WHEN to_regclass('"MIGRACION_ESQUEMA"') IS NULL THEN ''
      ELSE COALESCE((
        SELECT string_agg("mig_version", E'\\n' ORDER BY "mig_version")
        FROM "MIGRACION_ESQUEMA"
      ), '')
    END;
  `;
  const resultado = ejecutarPostgresql(
    'psql',
    ['-X', '-A', '-t', '-q', '-c', consulta],
    configuracion
  );

  return new Set(
    resultado.stdout
      .trim()
      .split(/\r?\n/)
      .map((valor) => valor.trim())
      .filter(Boolean)
  );
}

function prepararTablaControl(configuracion) {
  ejecutarPostgresql(
    'psql',
    [
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `
        CREATE TABLE IF NOT EXISTS "MIGRACION_ESQUEMA" (
          "mig_version" varchar(160) PRIMARY KEY,
          "mig_descripcion" varchar(255) NOT NULL,
          "mig_fecha_aplicacion" timestamptz NOT NULL DEFAULT NOW()
        );
      `,
    ],
    configuracion
  );
}

function aplicarMigracion(configuracion, nombre) {
  const ruta = path.join(DIRECTORIO_MIGRACIONES, nombre);
  const contenido = fs.readFileSync(ruta, 'utf8');
  const sql = `
    BEGIN;
    SELECT pg_advisory_xact_lock(hashtext('artify_migraciones'));
    ${contenido}
    INSERT INTO "MIGRACION_ESQUEMA"
      ("mig_version", "mig_descripcion")
    VALUES (${citarLiteral(nombre)}, ${citarLiteral(describir(nombre))});
    COMMIT;
  `;

  ejecutarPostgresql(
    'psql',
    ['-X', '-v', 'ON_ERROR_STOP=1'],
    configuracion,
    { input: sql }
  );
}

function main() {
  const configuracion = obtenerConfiguracionPostgresql();
  const migraciones = listarMigraciones();

  if (!configuracion.database || !configuracion.user) {
    throw new Error('Faltan las credenciales PostgreSQL en backend/.env');
  }

  console.log(
    `Destino: ${configuracion.database} en ${esHostLocal(configuracion.host) ? configuracion.host : 'host remoto'}`
  );

  if (!aplicar) {
    console.log('Plan de migraciones:');
    for (const nombre of migraciones) console.log(`- ${nombre}`);
    console.log('\nNo se hicieron cambios. Usa --apply para aplicar el plan.');
    return;
  }

  if (
    !esHostLocal(configuracion.host) &&
    process.env.ALLOW_REMOTE_MIGRATIONS !== 'true'
  ) {
    throw new Error(
      'Las migraciones remotas requieren ALLOW_REMOTE_MIGRATIONS=true'
    );
  }

  prepararTablaControl(configuracion);
  const aplicadas = consultarVersionesAplicadas(configuracion);
  const pendientes = migraciones.filter((nombre) => !aplicadas.has(nombre));

  if (pendientes.length === 0) {
    console.log('No hay migraciones pendientes.');
    return;
  }

  for (const nombre of pendientes) {
    aplicarMigracion(configuracion, nombre);
    console.log(`Aplicada: ${nombre}`);
  }

  console.log(`Migraciones aplicadas correctamente: ${pendientes.length}`);
}

try {
  main();
} catch (error) {
  console.error(`No se pudieron ejecutar las migraciones: ${error.message}`);
  process.exitCode = 1;
}
