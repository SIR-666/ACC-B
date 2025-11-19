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

  try {
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

async function getBalanceByType(tipe) {
  const where = tipe ? "WHERE tipe_keuangan = ?" : "";
  const params = tipe ? [tipe] : [];
  const sql = `
    SELECT 
      IFNULL(SUM(uang_masuk),0) AS total_masuk,
      IFNULL(SUM(uang_keluar),0) AS total_keluar,
      IFNULL(SUM(uang_masuk) - SUM(uang_keluar), 0) AS balance
    FROM \`${TABLE}\`
    ${where}
  `;
  try {
    const rows = await withConnection((q) => q(sql, params));
    return rows[0] || { total_masuk: 0, total_keluar: 0, balance: 0 };
  } catch (error) {
    console.error("Error fetching balance by type:", error);
    throw error;
  }
}

async function create(record) {
  try {
    const amountIn = Number(record.uang_masuk) || 0;
    const amountOut = Number(record.uang_keluar) || 0;
    const tipe = record.tipe_keuangan || null;

    if (amountOut > 0 && tipe) {
      const bal = await getBalanceByType(tipe);
      if (bal.balance < amountOut) {
        const err = new Error(
          `Saldo tidak cukup untuk tipe '${tipe}'. Saldo saat ini: ${bal.balance}`
        );
        err.code = "INSUFFICIENT_FUNDS";
        throw err;
      }
    }

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
    const sql = `
      SELECT
        IFNULL(SUM(uang_masuk),0) AS total_masuk,
        IFNULL(SUM(uang_keluar),0) AS total_keluar,
        IFNULL(SUM(uang_masuk) - SUM(uang_keluar),0) AS balance
      FROM \`${TABLE}\`
      ${whereSql}
    `;
    const rows = await withConnection((q) => q(sql, params));
    return rows[0] || { total_masuk: 0, total_keluar: 0, balance: 0 };
  } catch (error) {
    console.error("Error fetching totals:", error);
    throw error;
  }
}

async function getTotalsByType(tipe) {
  try {
    const rows = await withConnection((q) =>
      q(
        `SELECT
           IFNULL(SUM(uang_masuk),0) AS total_masuk,
           IFNULL(SUM(uang_keluar),0) AS total_keluar,
           IFNULL(SUM(uang_masuk) - SUM(uang_keluar),0) AS balance
         FROM \`${TABLE}\`
         WHERE tipe_keuangan = ?`,
        [tipe]
      )
    );
    return rows[0] || { total_masuk: 0, total_keluar: 0, balance: 0 };
  } catch (error) {
    console.error("Error fetching totals by type:", error);
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
  getTotalsByType,
  getBalanceByType,
};
