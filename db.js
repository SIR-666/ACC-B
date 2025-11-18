const mysql = require("mysql");

const db = mysql.createConnection({
    host: "202.10.43.21",
    user: "accm5651_caksyu",
    password: "970008F#m",
    database: "accm5651_Accounting"
});

db.connect(err => {
    if (err) {
        console.error("Koneksi gagal:", err);
    } else {
        console.log("MySQL Connected!");
    }
});

module.exports = db;
