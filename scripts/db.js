import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

// Prueba automática de conexión al iniciar
pool.getConnection()
  .then((conn) => {
    console.log('✅ Conexión exitosa a MySQL IONOS:', process.env.DB_HOST);
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Error al conectar a la base de datos:', err.message);
  });

export default pool;