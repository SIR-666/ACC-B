const service = require("../services/accountingServices");

async function getAll(req, res) {
  try {
    const options = {
      page: req.query.page,
      limit: req.query.limit,
      tipe: req.query.tipe,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search
    };
    const rows = await service.getAll(options);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await service.getById(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const payload = req.body || {};
    const result = await service.create(payload);
    res.status(201).json({ insertId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const payload = req.body || {};
    const result = await service.update(id, payload);
    if (!result.affectedRows) return res.status(404).json({ error: "Not found or no changes" });
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await service.remove(id);
    if (!result.affectedRows) return res.status(404).json({ error: "Not found" });
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getTotals(req, res) {
  try {
    const options = {
      tipe: req.query.tipe,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const totals = await service.getTotals(options);
    res.json({ data: totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getTotalsByType(req, res) {
  try {
    const tipe = req.params.tipe;
    const totals = await service.getTotalsByType(tipe);
    res.json({ data: totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getTotals,
  getTotalsByType
};