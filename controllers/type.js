const service = require("../services/typeServices");

async function getAll(req, res) {
  try {
    const rows = await service.findAll();
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const id = Number(req.params.id);
    const row = await service.findById(id);
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
    res.status(201).json({ id: result.id });
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
    res.json({ id: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const result = await service.remove(id);
    res.json({ id: result.id });
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
};
