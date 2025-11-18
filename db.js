const mysql = require("mysql");

// WAJIB pakai pool di shared hosting
const db = mysql.createPool({
  connectionLimit: 10,
  host: "202.10.43.21",
  user: "accm5651_caksyu",
  password: "970008F#m",
  database: "accm5651_Accounting",
  port: 3306
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
