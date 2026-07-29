const pool = require("./db");

const ensureSchema = async () => {
    await pool.query(`
        ALTER TABLE document_assignments
            ADD COLUMN IF NOT EXISTS approval_order INTEGER NOT NULL DEFAULT 1,
            ADD COLUMN IF NOT EXISTS approval_group_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS approval_box_config JSONB NOT NULL DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS approved_by INTEGER,
            ADD COLUMN IF NOT EXISTS signed_pdf_name VARCHAR(255);
    `);

    await pool.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_approved_by'
            ) THEN
                ALTER TABLE document_assignments
                    ADD CONSTRAINT fk_approved_by
                    FOREIGN KEY (approved_by)
                    REFERENCES users(id)
                    ON DELETE SET NULL;
            END IF;
        END $$;
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_assignments_approval_order
        ON document_assignments(uploaded_by, approval_group_id, approval_order);
    `);

    await pool.query(`
        UPDATE document_assignments
        SET approval_group_id = 'legacy-' || uploaded_by || '-' || stored_file_name
        WHERE approval_group_id IS NULL;
    `);

    await pool.query(`
        WITH ordered_assignments AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY approval_group_id
                    ORDER BY id
                ) AS next_approval_order
            FROM document_assignments
        )
        UPDATE document_assignments da
        SET approval_order = ordered_assignments.next_approval_order
        FROM ordered_assignments
        WHERE da.id = ordered_assignments.id
            AND da.approval_order = 1
            AND ordered_assignments.next_approval_order > 1;
    `);
};

module.exports = ensureSchema;
