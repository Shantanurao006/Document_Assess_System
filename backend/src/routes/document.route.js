const express = require("express");
const router = express.Router();
const documentService = require("../services/document.service");

router.get(
    "/my-documents/:email",
    documentService.getMyDocuments
);

module.exports = router;