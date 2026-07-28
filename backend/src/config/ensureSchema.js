const pool = require("./db");

const ensureSchema = async () => {
    await pool.query(`
        ALTER TABLE document_assignments
            ADD COLUMN IF NOT EXISTS approval_order INTEGER NOT NULL DEFAULT 1,
            ADD COLUMN IF NOT EXISTS approval_group_id VARCHAR(255),
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
};

module.exports = ensureSchema;
