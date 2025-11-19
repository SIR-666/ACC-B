const mysql = require("mysql");

// WAJIB pakai pool di shared hosting
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Cek koneksi pertama
db.getConnection((err, connection) => {
  if (err) {
    console.error("Koneksi gagal:", err);
  } else {
    console.log("MySQL Connected!");
    connection.release();
  }
});

module.exports = db;
