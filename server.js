require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const routes = require("./routes/routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/ACC-B", routes);

app.get("/ACC-B", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/ACC-B/check-db", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: "ERROR",
        error: err,
      });
    }
    res.json({
      status: "OK",
      message: "MySQL Connected",
      result: rows[0].result,
    });
  });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
