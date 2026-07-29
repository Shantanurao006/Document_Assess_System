const repository = require("../repositories/auth.repository");
const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const signPdf = require("../utils/pdfSigner");
const { uploadsDir, signaturesDir } = require("../config/uploadPaths");

const DEFAULT_APPROVAL_BOX = {
    type: "status",
    x: 50,
    y: 50,
    width: 240,
    height: 156,
    fields: [
        "Signature",
        "Approved By",
        "Approved On",
        "Status",
    ],
};

const getApprovalBoxLayout = (approvalBoxConfig) => {
    if (!Array.isArray(approvalBoxConfig) || approvalBoxConfig.length === 0) {
        return DEFAULT_APPROVAL_BOX;
    }

    const [savedBox] = approvalBoxConfig;

    return {
        ...DEFAULT_APPROVAL_BOX,
        ...savedBox,
        fields: Array.isArray(savedBox.fields) && savedBox.fields.length > 0
            ? savedBox.fields
            : DEFAULT_APPROVAL_BOX.fields,
    };
};

const getApprovalGroupKey = (assignment) =>
    assignment.approval_group_id || assignment.stored_file_name;

const validateApprover = async (email) => {

    const user = await repository.findUserByEmail(email);

    if (!user || user.role !== "ADMIN") {
        throw new Error(
            "This email is not registered as an Admin. If you want this user to be an approver, they must register as an Admin."
        );
    }

    return {
        id: user.id,
        email: user.email,
        role: user.role,
    };
};

const approveDocument = async (body, file) => {

  const {
    documentId,
    status,
    approvalDateTime,
    approvedBy,
} = body;

if (!file) {
    const error = new Error("Please upload your signature again.");
    error.statusCode = 400;
    throw error;
}

console.log("===============");
console.log("Approve Body:", body);
console.log("approvedBy:", approvedBy);
console.log("===============");

// Fetch admin details
const adminResult = await pool.query(
    `
    SELECT id, email
    FROM users
    WHERE email = $1
    `,
    [approvedBy]
);

if (adminResult.rows.length === 0) {
    throw new Error("Admin not found.");
}

const admin = adminResult.rows[0];
    // Get assignment details
    const result = await pool.query(
        `
        SELECT
            stored_file_name,
            approval_group_id,
            approval_box_config,
            uploaded_by,
            approval_order,
            assigned_to
        FROM document_assignments
        WHERE id = $1
        `,
        [documentId]
    );

    if (result.rows.length === 0) {
        throw new Error("Document not found.");
    }

    const assignment = result.rows[0];

    if (assignment.assigned_to !== admin.id) {
        throw new Error("This document is not assigned to this approver.");
    }

    const previousApprovals = await pool.query(
        `
        SELECT u.email
        FROM document_assignments da
        INNER JOIN users u
            ON da.assigned_to = u.id
        WHERE da.uploaded_by = $1
            AND COALESCE(da.approval_group_id, da.stored_file_name) = $2
            AND da.approval_order < $3
            AND da.status <> 'Approved'
        ORDER BY da.approval_order ASC
        LIMIT 1
        `,
        [
            assignment.uploaded_by,
            getApprovalGroupKey(assignment),
            assignment.approval_order,
        ]
    );

    if (previousApprovals.rows.length > 0) {
        const error = new Error(
            `Pending approval from ${previousApprovals.rows[0].email}.`
        );
        error.statusCode = 400;
        throw error;
    }

    const storedFileName = assignment.stored_file_name;
    const approvalBoxLayout = getApprovalBoxLayout(
        assignment.approval_box_config
    );

    const originalPdfPath = path.join(
        uploadsDir,
        storedFileName
    );

    const uploadedSignaturePath = path.join(
    signaturesDir,
    file.filename
);

console.log("PDF Path:", originalPdfPath);
console.log("Signature Path:", uploadedSignaturePath);

console.log(
    "PDF Exists:",
    fs.existsSync(originalPdfPath)
);

console.log(
    "Signature Exists:",
    fs.existsSync(uploadedSignaturePath)
);

if (!fs.existsSync(uploadedSignaturePath)) {
    const error = new Error(
        "Signature file not found. Please upload the signature again."
    );
    error.statusCode = 400;
    throw error;
}

if (!fs.existsSync(originalPdfPath)) {
    const error = new Error(
        "Original uploaded document is missing from the server. Please upload the document again."
    );
    error.statusCode = 400;
    throw error;
}

console.log("PDF Path:", originalPdfPath);
console.log("PDF Exists:", fs.existsSync(originalPdfPath));

console.log("Files in uploads:", fs.readdirSync(uploadsDir));

const approvalHistoryResult = await pool.query(
    `
    SELECT
        da.id,
        da.approval_order,
        da.status,
        da.approved_datetime,
        da.signed_by_image,
        approver_user.email AS assigned_email,
        approved_user.email AS approved_by_email
    FROM document_assignments da
    INNER JOIN users approver_user
        ON da.assigned_to = approver_user.id
    LEFT JOIN users approved_user
        ON da.approved_by = approved_user.id
    WHERE da.uploaded_by = $1
        AND COALESCE(da.approval_group_id, da.stored_file_name) = $2
    ORDER BY da.approval_order ASC
    `,
    [
        assignment.uploaded_by,
        getApprovalGroupKey(assignment),
    ]
);

const approvalEntries = approvalHistoryResult.rows
    .filter((historyRow) =>
        historyRow.id === Number(documentId)
            ? true
            : Boolean(historyRow.approved_datetime)
    )
    .map((historyRow) => ({
        approvalOrder: historyRow.approval_order,
        status: historyRow.id === Number(documentId) ? status : historyRow.status,
        approvedOn:
            historyRow.id === Number(documentId)
                ? approvalDateTime
                : historyRow.approved_datetime,
        approvedBy:
            historyRow.id === Number(documentId)
                ? admin.email
                : historyRow.approved_by_email || historyRow.assigned_email,
        signaturePath:
            historyRow.id === Number(documentId)
                ? uploadedSignaturePath
                : historyRow.signed_by_image
                    ? path.join(signaturesDir, historyRow.signed_by_image)
                    : null,
    }))
    .filter((entry) => entry.approvedOn);

const signedPdfPath = await signPdf(
    originalPdfPath,
    approvalEntries,
    approvalBoxLayout
);

    // Update DB
    await pool.query(
    `
    UPDATE document_assignments
        SET
            status = $1,
            approved_datetime = $2,
            signed_by_image = $3,
            approved_by = $4,
            signed_pdf_name = $5
        WHERE id = $6;
    `,
    [
        status,
        approvalDateTime,
        file.filename,
        admin.id,
        path.basename(signedPdfPath),
        documentId,
    ]
);

    return {
        documentId,
        status,
        signature: file.filename,
        signedPdfPath,
    };
};

module.exports = {
    validateApprover,
    approveDocument,
};
