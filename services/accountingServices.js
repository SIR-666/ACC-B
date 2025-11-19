const db = require("../config/db");
const util = require("util");

const TABLE = "keuangan";

async function withConnection(fn) {
  const conn = await new Promise((resolve, reject) => {
    db.getConnection((err, connection) =>
      err ? reject(err) : resolve(connection)
    );
  });
  const query = util.promisify(conn.query).bind(conn);
  try {
    return await fn(query);
  } finally {
    conn.release();
  }
}

async function getAll(options = {}) {
  try {
    const page = Number(options.page) > 0 ? Number(options.page) : 1;
    const limit = Number(options.limit) > 0 ? Number(options.limit) : 20;
    const offset = (page - 1) * limit;

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
    if (options.search) {
      where.push("(keterangan LIKE ?)");
      params.push(`%${options.search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `SELECT * FROM \`${TABLE}\` ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await withConnection((q) => q(sql, params));
  } catch (error) {
    console.error("Error fetching accounting list:", error);
    throw error;
  }
}

async function getById(id) {
  try {
    const rows = await withConnection((q) =>
      q(`SELECT * FROM \`${TABLE}\` WHERE id = ? LIMIT 1`, [id])
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Error fetching accounting by id:", error);
    throw error;
  }
}

async function create(record) {
  try {
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
      record.uang_masuk || 0,
      record.uang_keluar || 0,
      record.tanggal_uang_masuk || null,
      record.tanggal_uang_keluar || null,
      record.tipe_keuangan || null,
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
  try {
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
    const sql = `SELECT IFNULL(SUM(uang_masuk),0) AS total_masuk, IFNULL(SUM(uang_keluar),0) AS total_keluar FROM \`${TABLE}\` ${whereSql}`;
    const rows = await withConnection((q) => q(sql, params));
    return rows[0] || { total_masuk: 0, total_keluar: 0 };
  } catch (error) {
    console.error("Error fetching totals:", error);
    throw error;
  }
}

async function getDataByType(type) {
  try {
    const rows = await withConnection((q) =>
      q(`SELECT * FROM \`${TABLE}\` WHERE type = ?`, [type])
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Error fetching accounting by id:", error);
    throw error;
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getTotals,
  getDataByType
};
