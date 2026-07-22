const express = require("express");
const path = require("path");
const pool = require("../config/db");

const router = express.Router();

router.get(
    "/download/:documentId",
    async (req, res) => {

        try {

            const { documentId } = req.params;

            const result = await pool.query(
                `
                SELECT signed_pdf_name
                FROM document_assignments
                WHERE id = $1
                `,
                [documentId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Document not found."
                });
            }

            const signedPdf = result.rows[0].signed_pdf_name;

            if (!signedPdf) {
                return res.status(404).json({
                    success: false,
                    message: "Signed PDF not available."
                });
            }

            const filePath = path.join(
                __dirname,
                "../uploads",
                "signed",
                signedPdf
            );

            return res.download(filePath);

        } catch (err) {

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

    }
);

module.exports = router;