const db = require("../config/db");
const util = require("util");

const TABLE = "keuangan";
const TYPE_TABLE = "tipe_keuangan";

async function withConnection(fn) {
  const conn = await new Promise((resolve, reject) => {
    db.getConnection((err, connection) =>
      err ? reject(err) : resolve(connection)
    );
  });

  const query = util.promisify(conn.query).bind(conn);
  const beginTransaction = util.promisify(conn.beginTransaction).bind(conn);
  const commit = util.promisify(conn.commit).bind(conn);
  const rollback = util.promisify(conn.rollback).bind(conn);

  try {
    return await fn(query, { conn, beginTransaction, commit, rollback });
  } finally {
    conn.release();
  }
}

async function getAll(options = {}) {
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  let limit = null;

  if (
    options.limit !== undefined &&
    options.limit !== null &&
    options.limit !== "" &&
    String(options.limit).toLowerCase() !== "all"
  ) {
    limit = Number(options.limit) > 0 ? Number(options.limit) : 20;
  }

  const offset = limit ? (page - 1) * limit : 0;
  const where = [];
  const params = [];

  if (
    options.tipe !== undefined &&
    options.tipe !== null &&
    options.tipe !== ""
  ) {
    where.push("k.tipe_keuangan = ?");
    params.push(options.tipe);
  }

  if (options.startDate) {
    where.push(
      "((k.tanggal_uang_masuk IS NOT NULL AND k.tanggal_uang_masuk >= ?) OR (k.tanggal_uang_keluar IS NOT NULL AND k.tanggal_uang_keluar >= ?))"
    );
    params.push(options.startDate, options.startDate);
  }
  if (options.endDate) {
    where.push(
      "((k.tanggal_uang_masuk IS NOT NULL AND k.tanggal_uang_masuk <= ?) OR (k.tanggal_uang_keluar IS NOT NULL AND k.tanggal_uang_keluar <= ?))"
    );
    params.push(options.endDate, options.endDate);
  }

  if (options.search) {
    where.push("(k.keterangan LIKE ?)");
    params.push(`%${options.search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limitSql = limit ? "LIMIT ? OFFSET ?" : "";

  if (limit) params.push(limit, offset);

  const sql = `
    SELECT k.*, t.tipe AS tipe_label
    FROM \`${TABLE}\` k
    LEFT JOIN \`${TYPE_TABLE}\` t ON k.tipe_keuangan = t.id
    ${whereSql}
    ORDER BY k.created_at DESC
    ${limitSql}
  `;

  try {
    const rows = await withConnection((q) => q(sql, params));
    return rows;
  } catch (error) {
    console.error("Error fetching accounting list:", error);
    throw error;
  }
}

async function getById(id) {
  try {
    const sql = `
      SELECT k.*, t.tipe AS tipe_label
      FROM \`${TABLE}\` k
      LEFT JOIN \`${TYPE_TABLE}\` t ON k.tipe_keuangan = t.id
      WHERE k.id = ? LIMIT 1
    `;
    const rows = await withConnection((q) => q(sql, [id]));
    return rows[0] || null;
  } catch (error) {
    console.error("Error fetching accounting by id:", error);
    throw error;
  }
}

async function getBalanceByType(tipe) {
  const where = tipe ? "WHERE tipe_keuangan = ?" : "";
  const params = tipe ? [tipe] : [];
  const sql = `
    SELECT
      IFNULL(SUM(uang_masuk), 0) AS total_masuk,
      IFNULL(SUM(uang_keluar), 0) AS total_keluar,
      (IFNULL(SUM(uang_masuk),0) - IFNULL(SUM(uang_keluar),0)) AS balance
    FROM \`${TABLE}\`
    ${where}
  `;
  const rows = await withConnection((q) => q(sql, params));
  const r = rows[0] || { total_masuk: 0, total_keluar: 0, balance: 0 };
  return {
    total_masuk: Number(r.total_masuk) || 0,
    total_keluar: Number(r.total_keluar) || 0,
    balance: Number(r.balance) || 0,
  };
}

async function create(record) {
  try {
    const amountIn = Number(record.uang_masuk) || 0;
    const amountOut = Number(record.uang_keluar) || 0;
    const tipe = record.tipe_keuangan || null;

    const fields = [
      "uang_masuk",
      "uang_keluar",
      "tanggal_uang_masuk",
      "tanggal_uang_keluar",
      "tipe_keuangan",
      "keterangan",
      "created_at",
    ];
    const values = [
      amountIn,
      amountOut,
      record.tanggal_uang_masuk || null,
      record.tanggal_uang_keluar || null,
      tipe,
      record.keterangan || null,
      record.created_at || new Date(),
    ];
    const placeholders = fields.map(() => "?").join(", ");
    const sql = `INSERT INTO \`${TABLE}\` (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;
    const res = await withConnection((q) => q(sql, values));
    return { insertId: res.insertId, affectedRows: res.affectedRows };
  } catch (error) {
    console.error("Error creating accounting record:", error);
    throw error;
  }
}

async function update(id, record) {
  try {
    const allowed = [
      "uang_masuk",
      "uang_keluar",
      "tanggal_uang_masuk",
      "tanggal_uang_keluar",
      "tipe_keuangan",
      "keterangan",
    ];
    const sets = [];
    const params = [];

    for (const k of allowed) {
      if (k in record) {
        sets.push(`\`${k}\` = ?`);
        params.push(record[k]);
      }
    }
    if (!sets.length) return { affectedRows: 0 };

    params.push(id);
    const sql = `UPDATE \`${TABLE}\` SET ${sets.join(", ")} WHERE id = ?`;
    const res = await withConnection((q) => q(sql, params));
    return { affectedRows: res.affectedRows };
  } catch (error) {
    console.error("Error updating accounting record:", error);
    throw error;
  }
}

async function remove(id) {
  try {
    const res = await withConnection((q) =>
      q(`DELETE FROM \`${TABLE}\` WHERE id = ?`, [id])
    );
    return { affectedRows: res.affectedRows };
  } catch (error) {
    console.error("Error deleting accounting record:", error);
    throw error;
  }
}

async function getTotals(options = {}) {
  const where = [];
  const params = [];

  if (options.tipe) {
    where.push("tipe_keuangan = ?");
    params.push(options.tipe);
  }
  if (options.startDate) {
    where.push("(tanggal_uang_masuk >= ? OR tanggal_uang_keluar >= ?)");
    params.push(options.startDate, options.startDate);
  }
  if (options.endDate) {
    where.push("(tanggal_uang_masuk <= ? OR tanggal_uang_keluar <= ?)");
    params.push(options.endDate, options.endDate);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `
    SELECT
      IFNULL(SUM(uang_masuk),0) AS total_masuk,
      IFNULL(SUM(uang_keluar),0) AS total_keluar,
      (IFNULL(SUM(uang_masuk),0) - IFNULL(SUM(uang_keluar),0)) AS balance
    FROM \`${TABLE}\`
    ${whereSql}
  `;
  const rows = await withConnection((q) => q(sql, params));
  const r = rows[0] || { total_masuk: 0, total_keluar: 0, balance: 0 };
  return {
    total_masuk: Number(r.total_masuk) || 0,
    total_keluar: Number(r.total_keluar) || 0,
    balance: Number(r.balance) || 0,
  };
}

async function getTotalsByType(tipe) {
  const sql = `
    SELECT
      IFNULL(SUM(uang_masuk),0) AS total_masuk,
      IFNULL(SUM(uang_keluar),0) AS total_keluar,
      (IFNULL(SUM(uang_masuk),0) - IFNULL(SUM(uang_keluar),0)) AS balance
    FROM \`${TABLE}\`
    WHERE tipe_keuangan = ?
  `;
  const rows = await withConnection((q) => q(sql, [tipe]));
  const r = rows[0] || { total_masuk: 0, total_keluar: 0, balance: 0 };
  return {
    total_masuk: Number(r.total_masuk) || 0,
    total_keluar: Number(r.total_keluar) || 0,
    balance: Number(r.balance) || 0,
  };
}

async function exportCsv(options = {}) {
  const where = [];
  const params = [];

  if (options.tipe) {
    where.push("k.tipe_keuangan = ?");
    params.push(options.tipe);
  }
  if (options.startDate) {
    where.push("(k.tanggal_uang_masuk >= ? OR k.tanggal_uang_keluar >= ?)");
    params.push(options.startDate, options.startDate);
  }
  if (options.endDate) {
    where.push("(k.tanggal_uang_masuk <= ? OR k.tanggal_uang_keluar <= ?)");
    params.push(options.endDate, options.endDate);
  }
  if (options.search) {
    where.push("(k.keterangan LIKE ?)");
    params.push(`%${options.search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT 
      k.id,
      k.uang_masuk,
      k.uang_keluar,
      k.tanggal_uang_masuk,
      k.tanggal_uang_keluar,
      k.tipe_keuangan,
      t.tipe AS tipe_label,
      k.keterangan,
      k.created_at
    FROM \`${TABLE}\` k
    LEFT JOIN \`${TYPE_TABLE}\` t ON k.tipe_keuangan = t.id
    ${whereSql}
    ORDER BY k.created_at DESC
  `;

  const rows = await withConnection((q) => q(sql, params));

  // CSV generation
  const headers = [
    "id",
    "uang_masuk",
    "uang_keluar",
    "tanggal_uang_masuk",
    "tanggal_uang_keluar",
    "tipe_keuangan",
    "tipe_label",
    "keterangan",
    "created_at",
  ];

  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (
      s.includes('"') ||
      s.includes(",") ||
      s.includes("\n") ||
      s.includes("\r")
    ) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers.join(",")];
  for (const r of rows) {
    const line = headers.map((h) => escape(r[h])).join(",");
    lines.push(line);
  }

  return lines.join("\r\n");
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getTotals,
  getTotalsByType,
  getBalanceByType,
  exportCsv,
};
