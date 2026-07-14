#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  RAIZ_PROYECTO,
  citarIdentificador,
  citarLiteral,
  crearEntornoPostgresql,
  ejecutarPostgresql,
  esHostLocal,
  obtenerConfiguracionPostgresql,
} = require('./lib/postgresql-cli');

function ejecutarMigraciones(configuracion) {
  const resultado = spawnSync(
    process.execPath,
    [path.join(RAIZ_PROYECTO, 'scripts', 'ejecutar-migraciones.js'), '--apply'],
    {
      encoding: 'utf8',
      env: {
        ...crearEntornoPostgresql(configuracion),
        DATABASE_URL: '',
        DB_HOST: configuracion.host,
        DB_PORT: String(configuracion.port),
        DB_USER: configuracion.user,
        DB_PASSWORD: configuracion.password,
        DB_NAME: configuracion.database,
      },
    }
  );

  if (resultado.status !== 0) {
    throw new Error((resultado.stderr || resultado.stdout).trim());
  }
}

function main() {
  const origen = obtenerConfiguracionPostgresql();
  if (!esHostLocal(origen.host)) {
    throw new Error(
      'La verificación automática solo se permite sobre PostgreSQL local'
    );
  }

  const sufijo = `${Date.now()}_${process.pid}`;
  const baseRestaurada = `artify_restore_${sufijo}`.slice(0, 63);
  const rolTemporal = `artify_app_${process.pid}`;
  const passwordTemporal = crypto.randomBytes(24).toString('base64url');
  const archivoRespaldo = path.join(
    os.tmpdir(),
    `artify_backup_${sufijo}.dump`
  );
  const administracion = { ...origen, database: 'postgres' };
  const restaurada = { ...origen, database: baseRestaurada };
  let baseCreada = false;

  console.log(`Verificando respaldo local de ${origen.database}...`);

  try {
    ejecutarPostgresql(
      'pg_dump',
      [
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        `--file=${archivoRespaldo}`,
      ],
      origen
    );

    ejecutarPostgresql('createdb', [baseRestaurada], administracion);
    baseCreada = true;
    ejecutarPostgresql(
      'pg_restore',
      ['--no-owner', '--no-privileges', `--dbname=${baseRestaurada}`, archivoRespaldo],
      administracion
    );

    const conteo = ejecutarPostgresql(
      'psql',
      [
        '-X',
        '-A',
        '-t',
        '-q',
        '-c',
        `
          SELECT COUNT(*)
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN (
              'USUARIO', 'CONFIGURACION', 'IMAGEN',
              'SESION_EDICION', 'OPERACION'
            );
        `,
      ],
      restaurada
    ).stdout.trim();

    if (conteo !== '5') {
      throw new Error(`La restauración contiene ${conteo} de 5 tablas funcionales`);
    }

    ejecutarMigraciones(restaurada);

    const rutaRol = path.join(
      RAIZ_PROYECTO,
      'database',
      'postgresql',
      'app-role.sql'
    );
    ejecutarPostgresql(
      'psql',
      [
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-v',
        `app_user=${rolTemporal}`,
        '-v',
        `app_password=${passwordTemporal}`,
        '-f',
        rutaRol,
      ],
      restaurada
    );

    const configRol = {
      ...restaurada,
      user: rolTemporal,
      password: passwordTemporal,
    };
    const consulta = ejecutarPostgresql(
      'psql',
      ['-X', '-A', '-t', '-q', '-c', 'SELECT COUNT(*) FROM "USUARIO";'],
      configRol
    );
    if (!/^\d+$/.test(consulta.stdout.trim())) {
      throw new Error('El rol de aplicación no pudo consultar USUARIO');
    }

    ejecutarPostgresql(
      'psql',
      [
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `
          BEGIN;
          INSERT INTO "USUARIO" (
            "usr_nombres", "usr_apellidos", "usr_cedula",
            "usr_fecha_nacimiento", "usr_correo", "usr_contrasena"
          ) VALUES (
            'Prueba', 'Permisos', '999999${process.pid}', '1990-01-01',
            'permisos.${process.pid}@artify.local', 'hash-temporal'
          );
          ROLLBACK;
        `,
      ],
      configRol
    );

    const ddlDenegado = ejecutarPostgresql(
      'psql',
      [
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        'DROP TABLE "OPERACION";',
      ],
      configRol,
      { permitirFallo: true }
    );
    if (ddlDenegado.status === 0) {
      throw new Error('El rol temporal obtuvo permisos DDL no esperados');
    }

    const atributosRol = ejecutarPostgresql(
      'psql',
      [
        '-X',
        '-A',
        '-t',
        '-q',
        '-c',
        `
          SELECT rolsuper, rolcreaterole, rolcreatedb
          FROM pg_roles
          WHERE rolname = ${citarLiteral(rolTemporal)};
        `,
      ],
      administracion
    ).stdout.trim();
    if (atributosRol !== 'f|f|f') {
      throw new Error(`Atributos inesperados del rol: ${atributosRol}`);
    }

    console.log(
      JSON.stringify(
        {
          respaldoBytes: fs.statSync(archivoRespaldo).size,
          tablasFuncionales: Number(conteo),
          migraciones: 'correctas',
          lecturaRolAplicacion: 'correcta',
          escrituraTransaccional: 'correcta',
          ddlDenegado: true,
          resultado: 'restauración verificada',
        },
        null,
        2
      )
    );
  } finally {
    if (baseCreada) {
      ejecutarPostgresql(
        'dropdb',
        ['--if-exists', '--force', baseRestaurada],
        administracion,
        { permitirFallo: true }
      );
    }

    ejecutarPostgresql(
      'psql',
      [
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `DROP ROLE IF EXISTS ${citarIdentificador(rolTemporal)};`,
      ],
      administracion,
      { permitirFallo: true }
    );

    fs.rmSync(archivoRespaldo, { force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(`La verificación de respaldo falló: ${error.message}`);
  process.exitCode = 1;
}
