const express = require("express");
const router = express.Router();
const accountingRoutes = require("./accountingRoutes");
const typeRoutes = require("./typeRoutes");

router.use("/acc", accountingRoutes);

router.use("/types", typeRoutes);

module.exports = router;
