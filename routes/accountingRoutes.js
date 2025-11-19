const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/accounting");

// GET /api/accounting/           
router.get("/", ctrl.getAll);

// GET /api/accounting/totals     
router.get("/totals", ctrl.getTotals);

// GET /api/accounting/totals/:tipe
router.get("/totals/:tipe", ctrl.getTotalsByType);

// GET /api/accounting/:id        
router.get("/:id", ctrl.getById);

// POST /api/accounting/          
router.post("/", ctrl.create);

// PUT /api/accounting/:id        
router.put("/:id", ctrl.update);

// DELETE /api/accounting/:id     
router.delete("/:id", ctrl.remove);

module.exports = router;