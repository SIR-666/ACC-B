const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// API health-check basic
app.get("/ACC-B", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

// API check MySQL
app.get("/ACC-B/check-db", (req, res) => {
    db.query("SELECT 1 + 1 AS result", (err, rows) => {
        if (err) {
            return res.status(500).json({
                status: "ERROR",
                error: err
            });
        }
        res.json({
            status: "OK",
            message: "MySQL Connected",
            result: rows[0].result
        });
    });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
