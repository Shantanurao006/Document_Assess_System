const express = require("express");

const controller = require("../controllers/approver.controller");

const router = express.Router();

router.post("/validate", controller.validateApprover);

module.exports = router;