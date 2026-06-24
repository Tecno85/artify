// ========== DEPENDENCIAS ==========
const { Pool } = require('pg');

const tablas = ['USUARIO', 'CONFIGURACION', 'IMAGEN', 'SESION_EDICION', 'OPERACION'];

function convertirPlaceholders(sql) {
  let indice = 0;
  return sql.replace(/\?/g, () => `$${++indice}`);
}

function citarTablas(sql) {
  return tablas.reduce(
    (consulta, tabla) =>
      consulta.replace(new RegExp(`(?<!")\\b${tabla}\\b(?!")`, 'g'), `"${tabla}"`),
    sql
  );
}

function prepararConsulta(sql) {
  return convertirPlaceholders(citarTablas(sql));
}

function normalizarResultado(resultado) {
  if (resultado.command === 'SELECT') {
    return resultado.rows;
  }

  const primeraFila = resultado.rows?.[0] || {};
  const primerValor = Object.values(primeraFila)[0];

  return {
    affectedRows: resultado.rowCount,
    rowCount: resultado.rowCount,
    insertId: primerValor,
    rows: resultado.rows,
  };
}

// ========== CONEXIÓN A POSTGRESQL ==========
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verificar la conexión apenas inicia el backend
pool
  .query('SELECT 1')
  .then(() => {
    console.log('✅ Conectado a PostgreSQL correctamente');
  })
  .catch((err) => {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
  });

const db = {
  query(sql, params, callback) {
    let valores = params;
    let cb = callback;

    if (typeof params === 'function') {
      cb = params;
      valores = [];
    }

    const consulta = prepararConsulta(sql);

    if (typeof cb === 'function') {
      pool
        .query(consulta, valores || [])
        .then((resultado) => cb(null, normalizarResultado(resultado)))
        .catch((err) => cb(err));
      return;
    }

    return pool.query(consulta, valores || []);
  },

  promise() {
    let clienteTransaccion = null;

    return {
      async query(sql, params = []) {
        const ejecutor = clienteTransaccion || pool;
        const resultado = await ejecutor.query(prepararConsulta(sql), params);
        return [normalizarResultado(resultado)];
      },
      async beginTransaction() {
        clienteTransaccion = await pool.connect();
        await clienteTransaccion.query('BEGIN');
      },
      async commit() {
        if (!clienteTransaccion) {
          return;
        }

        await clienteTransaccion.query('COMMIT');
        clienteTransaccion.release();
        clienteTransaccion = null;
      },
      async rollback() {
        if (!clienteTransaccion) {
          return;
        }

        await clienteTransaccion.query('ROLLBACK');
        clienteTransaccion.release();
        clienteTransaccion = null;
      },
    };
  },

  pool,
};

// ========== EXPORTACIÓN ==========
module.exports = db;
