const pool = require("../config/db");

exports.getMyDocuments = async (req, res) => {

    try {

        const { email } = req.params;

        const result = await pool.query(
            `
            SELECT
                da.id,
                da.original_file_name,
                da.status,
                da.assigned_datetime AS uploaded_datetime,
                da.approved_datetime,
                da.signed_pdf_name,
                CASE
                    WHEN da.status = 'Pending'
                        AND blocked_by.email IS NOT NULL
                        THEN 'Pending approval from ' || blocked_by.email
                    WHEN da.status = 'Pending'
                        THEN 'Pending approval from ' || assigned_user.email
                    WHEN da.approved_by IS NOT NULL
                        THEN approved_user.email
                    ELSE assigned_user.email
                END AS approver_email
            FROM document_assignments da
            INNER JOIN users uploaded_user
                ON da.uploaded_by = uploaded_user.id
            INNER JOIN users assigned_user
                ON da.assigned_to = assigned_user.id
            LEFT JOIN users approved_user
                ON da.approved_by = approved_user.id
            LEFT JOIN LATERAL (
                SELECT u.email
                FROM document_assignments previous_da
                INNER JOIN users u
                    ON previous_da.assigned_to = u.id
                WHERE previous_da.uploaded_by = da.uploaded_by
                    AND COALESCE(previous_da.approval_group_id, previous_da.stored_file_name)
                        = COALESCE(da.approval_group_id, da.stored_file_name)
                    AND previous_da.approval_order < da.approval_order
                    AND previous_da.status <> 'Approved'
                ORDER BY previous_da.approval_order ASC
                LIMIT 1
            ) blocked_by ON true
            WHERE uploaded_user.email = $1
            ORDER BY da.assigned_datetime DESC, da.approval_order ASC
            `,
            [email]
        );

        return res.json(result.rows);

    } catch (error) {

        return res.status(500).json({
            message: error.message
        });

    }

};
