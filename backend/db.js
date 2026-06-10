// ============================================================
// db.js - Konfigurasi Koneksi MySQL
// ============================================================
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              process.env.DB_PORT     || 3306,
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'cinemax_db',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  charset:           'utf8mb4'
});

// Test koneksi saat startup
pool.getConnection()
  .then(async conn => {
    console.log('✅ MySQL terhubung ke database:', process.env.DB_NAME || 'cinemax_db');
    try {
      await conn.query('SET GLOBAL max_allowed_packet = 16777216'); // 16MB
    } catch (e) {
      // Abaikan jika tidak punya akses SUPER
    }
    conn.release();
  })
  .catch(err => {
    console.error('❌ Gagal terhubung ke MySQL:', err.message);
    console.error('   Pastikan MySQL server berjalan dan kredensial di .env sudah benar.');
  });

// Tangani error tak terduga pada pool untuk mencegah crash
pool.on('error', (err) => {
  console.error('⚠️ MySQL Pool Error:', err);
});

module.exports = pool;
