const repository = require("../repositories/auth.repository");
const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const signPdf = require("../utils/pdfSigner");

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
    } = body;

    // Get document details
    const result = await pool.query(
        `
        SELECT stored_file_name
        FROM document_assignments
        WHERE id = $1
        `,
        [documentId]
    );

    if (result.rows.length === 0) {
        throw new Error("Document not found.");
    }

    const storedFileName = result.rows[0].stored_file_name;

    const originalPdfPath = path.join(
        __dirname,
        "../uploads",
        storedFileName
    );

    const uploadedSignaturePath = path.join(
    __dirname,
    "../uploads",
    "signatures",
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
    throw new Error(
        `Signature file not found: ${uploadedSignaturePath}`
    );
}

const signedPdfPath = await signPdf(
    originalPdfPath,
    uploadedSignaturePath,
    status,
    approvalDateTime
);

    // Update DB
    await pool.query(
        `
        UPDATE document_assignments
            SET
                status = $1,
                approved_datetime = $2,
                signed_by_image = $3
            WHERE id = $4;
        `,
        [
            status,
            approvalDateTime,
            file.filename,
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