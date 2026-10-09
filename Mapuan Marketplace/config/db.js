const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mapuan_marketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

async function verifyConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[db] Connected to ${process.env.DB_NAME || 'mapuan_marketplace'}`);
    connection.release();
  } catch (err) {
    console.error('[db] Could not connect:', err.message);
    console.error('[db] Start MySQL and import database/schema.sql.');
  }
}

module.exports = { pool, verifyConnection };
