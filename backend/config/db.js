// ========== DEPENDENCIAS ==========
const mysql2 = require('mysql2');

// ========== CONEXIÓN A MYSQL ==========
const db = mysql2.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verificar la conexión apenas inicia el backend
db.connect((err) => {
  if (err) {
    console.error('❌ Error al conectar a MySQL:', err.message);
    return;
  }

  console.log('✅ Conectado a MySQL correctamente');
});

// ========== EXPORTACIÓN ==========
module.exports = db;
