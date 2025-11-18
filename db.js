const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",           // dari cPanel
    user: 'accm5651_caksyu',    // MySQL user
    password: '970008F#m',   // MySQL password
    database: 'accm5651_Accounting' // nama database
});

db.connect((err) => {
    if (err) {
        console.error("Koneksi gagal:", err);
    } else {
        console.log("MySQL Connected!");
    }
});

module.exports = db;
