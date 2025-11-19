const db = require("../config/db");
const TABLE = "tipe_keuangan";

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function create(record) {
  const sql = `INSERT INTO \`${TABLE}\` (tipe) VALUES (?)`;
  const params = [record.tipe];
  const result = await query(sql, params);
  return { id: result.insertId, ...record };
}

async function findAll() {
  const sql = `SELECT tipe FROM \`${TABLE}\``;
  const results = await query(sql);
  return results;
}

async function findById(id) {
  const sql = `SELECT tipe FROM \`${TABLE}\` WHERE id = ?`;
  const params = [id];
  const results = await query(sql, params);
  return results[0];
}

async function update(id, record) {
  const sql = `UPDATE \`${TABLE}\` SET tipe = ? WHERE id = ?`;
  const params = [record.tipe, id];
  await query(sql, params);
  return { id, ...record };
}

async function remove(id) {
  const sql = `DELETE FROM \`${TABLE}\` WHERE id = ?`;
  const params = [id];
  await query(sql, params);
  return { id };
}

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove
};