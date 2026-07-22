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
                da.uploaded_datetime,
                da.approved_datetime,
                da.signed_pdf_name,
                u.email AS approver_email
            FROM document_assignments da
            LEFT JOIN users u
                ON da.approved_by = u.id
            WHERE da.user_email = $1
            ORDER BY da.uploaded_datetime DESC
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