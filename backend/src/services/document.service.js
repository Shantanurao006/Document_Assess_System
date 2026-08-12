const pool = require("../config/db");

exports.getMyDocuments = async (req, res) => {

    try {

        const { email } = req.params;

        // Return one entry per uploaded document (group by approval_group_id or stored_file_name)
        const result = await pool.query(
            `
            SELECT DISTINCT ON (COALESCE(da.approval_group_id, da.stored_file_name))
                da.id,
                da.original_file_name,
                CASE
                    WHEN approval_stats.rejected_approvals > 0 THEN 'Rejected'
                    WHEN approval_stats.completed_approvals = approval_stats.total_approvers THEN 'Approved'
                    ELSE 'Pending'
                END AS status,
                da.assigned_datetime AS uploaded_datetime,
                da.approved_datetime,
                da.signed_pdf_name,
                approval_stats.total_approvers,
                approval_stats.completed_approvals,
                CASE
                    WHEN approval_stats.rejected_approvals > 0
                        THEN 'Rejected by ' || COALESCE(rejected_by.email, assigned_user.email)
                    WHEN current_pending.email IS NOT NULL
                        THEN 'Pending approval from ' || current_pending.email
                    WHEN da.approved_by IS NOT NULL
                        THEN approved_user.email
                    ELSE assigned_user.email
                END AS approver_email
            FROM document_assignments da
            INNER JOIN users uploaded_user
                ON da.uploaded_by = uploaded_user.id
            INNER JOIN users assigned_user
                ON da.assigned_to = assigned_user.id
            INNER JOIN LATERAL (
                SELECT
                    COUNT(*)::int AS total_approvers,
                    COUNT(*) FILTER (WHERE grouped_da.status = 'Approved')::int AS completed_approvals,
                    COUNT(*) FILTER (WHERE grouped_da.status = 'Rejected')::int AS rejected_approvals
                FROM document_assignments grouped_da
                WHERE grouped_da.uploaded_by = da.uploaded_by
                    AND COALESCE(grouped_da.approval_group_id, grouped_da.stored_file_name)
                        = COALESCE(da.approval_group_id, da.stored_file_name)
            ) approval_stats ON true
            LEFT JOIN users approved_user
                ON da.approved_by = approved_user.id
            LEFT JOIN LATERAL (
                SELECT u.email
                FROM document_assignments pending_da
                INNER JOIN users u
                    ON pending_da.assigned_to = u.id
                WHERE pending_da.uploaded_by = da.uploaded_by
                    AND COALESCE(pending_da.approval_group_id, pending_da.stored_file_name)
                        = COALESCE(da.approval_group_id, da.stored_file_name)
                    AND pending_da.status = 'Pending'
                ORDER BY pending_da.approval_order ASC
                LIMIT 1
            ) current_pending ON true
            LEFT JOIN LATERAL (
                SELECT COALESCE(rejected_user.email, assigned_rejected_user.email) AS email
                FROM document_assignments rejected_da
                INNER JOIN users assigned_rejected_user
                    ON rejected_da.assigned_to = assigned_rejected_user.id
                LEFT JOIN users rejected_user
                    ON rejected_da.approved_by = rejected_user.id
                WHERE rejected_da.uploaded_by = da.uploaded_by
                    AND COALESCE(rejected_da.approval_group_id, rejected_da.stored_file_name)
                        = COALESCE(da.approval_group_id, da.stored_file_name)
                    AND rejected_da.status = 'Rejected'
                ORDER BY rejected_da.approval_order ASC
                LIMIT 1
            ) rejected_by ON true
            WHERE uploaded_user.email = $1
            ORDER BY COALESCE(da.approval_group_id, da.stored_file_name), da.approval_order DESC, da.assigned_datetime DESC
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
