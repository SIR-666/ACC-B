const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/type");

// GET /api/types/           
router.get("/", ctrl.getAll);

// GET /api/types/:id        
router.get("/:id", ctrl.getById);

// POST /api/types/          
router.post("/", ctrl.create);

// PUT /api/types/:id
router.put("/:id", ctrl.update);

// DELETE /api/types/:id     
router.delete("/:id", ctrl.remove);

module.exports = router;