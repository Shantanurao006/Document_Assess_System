-- ============================================
-- DOCUMENT APPROVAL SYSTEM DATABASE SCHEMA
-- ============================================

-- Drop tables if they already exist (optional)
DROP TABLE IF EXISTS document_assignments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    pin VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,

    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,

    status VARCHAR(20) DEFAULT 'PENDING',

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

-- ============================================
-- DOCUMENT ASSIGNMENTS
-- ============================================

CREATE TABLE document_assignments (

    id SERIAL PRIMARY KEY,

    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,

    assigned_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_datetime TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'Pending',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    uploaded_by INTEGER NOT NULL,
    assigned_to INTEGER NOT NULL,

    signed_by_image VARCHAR(255),

    remarks TEXT,

    CONSTRAINT fk_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_documents_user
ON documents(user_id);

CREATE INDEX idx_assignments_uploaded_by
ON document_assignments(uploaded_by);

CREATE INDEX idx_assignments_assigned_to
ON document_assignments(assigned_to);

CREATE INDEX idx_assignments_status
ON document_assignments(status);