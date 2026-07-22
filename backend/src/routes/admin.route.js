const express = require("express");
const pool = require("../config/db");

const router = express.Router();

const upload = require("../middleware/uploadSignature");
const approverController = require("../controllers/approver.controller");


/*
 * GET Assigned Documents
 */
router.get("/documents/:adminId", async (req, res) => {

    try {

        const { adminId } = req.params;

        const result = await pool.query(
            `
            SELECT
                da.id,
                da.original_file_name,
                da.stored_file_name,
                da.assigned_datetime,
                da.status,
                u.email AS uploaded_by_email
            FROM document_assignments da
            INNER JOIN users u
                ON da.uploaded_by = u.id
            WHERE da.assigned_to = $1
            ORDER BY da.assigned_datetime DESC
            `,
            [adminId]
        );

        const documents = result.rows.map((doc) => ({
    ...doc,
    file_url: `http://localhost:5000/uploads/${doc.stored_file_name}`,
}));

return res.status(200).json({
    success: true,
    data: documents,
});

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

});

/*
 * Approve / Reject Document
 */
router.post(
    "/document/approve",
    upload.single("signature"),
    approverController.approveDocument
);

module.exports = router;