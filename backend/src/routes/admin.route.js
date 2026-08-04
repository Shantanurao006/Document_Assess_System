const express = require("express");
const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const { uploadsDir, signedDir } = require("../config/uploadPaths");

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
                da.signed_pdf_name,
                da.approval_box_config,
                da.assigned_datetime,
                da.status,
                da.approval_order,
                approval_stats.total_approvers,
                approval_stats.completed_approvals,
                u.email AS uploaded_by_email
            FROM document_assignments da
            INNER JOIN users u
                ON da.uploaded_by = u.id
            INNER JOIN LATERAL (
                SELECT
                    COUNT(*)::int AS total_approvers,
                    COUNT(*) FILTER (WHERE grouped_da.status = 'Approved')::int AS completed_approvals
                FROM document_assignments grouped_da
                WHERE grouped_da.uploaded_by = da.uploaded_by
                    AND COALESCE(grouped_da.approval_group_id, grouped_da.stored_file_name)
                        = COALESCE(da.approval_group_id, da.stored_file_name)
            ) approval_stats ON true
            WHERE da.assigned_to = $1
                AND NOT EXISTS (
                    SELECT 1
                    FROM document_assignments previous_da
                    WHERE previous_da.uploaded_by = da.uploaded_by
                        AND COALESCE(previous_da.approval_group_id, previous_da.stored_file_name)
                            = COALESCE(da.approval_group_id, da.stored_file_name)
                        AND previous_da.approval_order < da.approval_order
                        AND previous_da.status <> 'Approved'
                )
            ORDER BY da.assigned_datetime DESC
            `,
            [adminId]
        );

        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
        const documents = result.rows.map((doc) => ({
            ...doc,
            file_url: (() => {
                if (doc.signed_pdf_name) {
                    const signedPath = path.join(signedDir, doc.signed_pdf_name);
                    const altSignedPath = path.join(uploadsDir, doc.signed_pdf_name);
                    if (fs.existsSync(signedPath)) {
                        return `${baseUrl}/uploads/signed/${doc.signed_pdf_name}`;
                    }
                    if (fs.existsSync(altSignedPath)) {
                        return `${baseUrl}/uploads/${doc.signed_pdf_name}`;
                    }
                }
                return `${baseUrl}/uploads/${doc.stored_file_name}`;
            })(),
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
// GET last uploaded signature for an admin
router.get("/signature/:adminId", approverController.getLastSignature);

router.post(
    "/document/approve",
    upload.single("signature"),
    approverController.approveDocument
);

module.exports = router;
