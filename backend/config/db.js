// ========== DEPENDENCIAS ==========
const { Pool } = require('pg');

const tablas = ['USUARIO', 'CONFIGURACION', 'IMAGEN', 'SESION_EDICION', 'OPERACION'];

function convertirPlaceholdersEnSegmento(sql, siguientePlaceholder) {
  return sql.replace(/\?/g, () => `$${siguientePlaceholder()}`);
}

function citarTablasEnSegmento(sql) {
  return tablas.reduce(
    (consulta, tabla) =>
      consulta.replace(new RegExp(`(?<!")\\b${tabla}\\b(?!")`, 'g'), `"${tabla}"`),
    sql
  );
}

function prepararConsulta(sql) {
  let resultado = '';
  let segmentoNormal = '';
  let estado = 'normal';
  let etiquetaDollar = '';
  let indicePlaceholder = 0;

  function vaciarSegmentoNormal() {
    if (!segmentoNormal) {
      return;
    }

    resultado += convertirPlaceholdersEnSegmento(
      citarTablasEnSegmento(segmentoNormal),
      () => ++indicePlaceholder
    );
    segmentoNormal = '';
  }

  for (let i = 0; i < sql.length; i++) {
    const actual = sql[i];
    const siguiente = sql[i + 1];

    if (estado === 'normal') {
      if (actual === "'") {
        vaciarSegmentoNormal();
        estado = 'comillaSimple';
        resultado += actual;
        continue;
      }

      if (actual === '"') {
        vaciarSegmentoNormal();
        estado = 'comillaDoble';
        resultado += actual;
        continue;
      }

      if (actual === '-' && siguiente === '-') {
        vaciarSegmentoNormal();
        estado = 'comentarioLinea';
        resultado += actual + siguiente;
        i++;
        continue;
      }

      if (actual === '/' && siguiente === '*') {
        vaciarSegmentoNormal();
        estado = 'comentarioBloque';
        resultado += actual + siguiente;
        i++;
        continue;
      }

      if (actual === '$') {
        const match = sql.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
        if (match) {
          vaciarSegmentoNormal();
          estado = 'dollarQuote';
          etiquetaDollar = match[0];
          resultado += etiquetaDollar;
          i += etiquetaDollar.length - 1;
          continue;
        }
      }

      segmentoNormal += actual;
      continue;
    }

    resultado += actual;

    if (estado === 'comillaSimple') {
      if (actual === "'" && siguiente === "'") {
        resultado += siguiente;
        i++;
      } else if (actual === "'") {
        estado = 'normal';
      }
      continue;
    }

    if (estado === 'comillaDoble') {
      if (actual === '"' && siguiente === '"') {
        resultado += siguiente;
        i++;
      } else if (actual === '"') {
        estado = 'normal';
      }
      continue;
    }

    if (estado === 'comentarioLinea') {
      if (actual === '\n') {
        estado = 'normal';
      }
      continue;
    }

    if (estado === 'comentarioBloque') {
      if (actual === '*' && siguiente === '/') {
        resultado += siguiente;
        i++;
        estado = 'normal';
      }
      continue;
    }

    if (estado === 'dollarQuote') {
      if (sql.slice(i, i + etiquetaDollar.length) === etiquetaDollar) {
        resultado += sql.slice(i + 1, i + etiquetaDollar.length);
        i += etiquetaDollar.length - 1;
        estado = 'normal';
        etiquetaDollar = '';
      }
    }
  }

  vaciarSegmentoNormal();
  return resultado;
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

        try {
          await clienteTransaccion.query('COMMIT');
        } finally {
          clienteTransaccion.release();
          clienteTransaccion = null;
        }
      },
      async rollback() {
        if (!clienteTransaccion) {
          return;
        }

        try {
          await clienteTransaccion.query('ROLLBACK');
        } finally {
          clienteTransaccion.release();
          clienteTransaccion = null;
        }
      },
    };
  },

  pool,
};

// ========== EXPORTACIÓN ==========
module.exports = db;
