const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pool = require("../config/db");
const { ensureUploadDirectories, uploadsDir } = require("../config/uploadPaths");

const router = express.Router();

// Create uploads folder automatically if it doesn't exist
ensureUploadDirectories();

const uploadDir = uploadsDir;

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
    cb(null, file.originalname);
},
});

// Allowed File Types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/jpg",
        "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed."
            ),
            false
        );
    }
};

// Multer Configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

// Upload API
router.post("/upload", upload.array("documents"), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one file.",
            });
        }

const { uploadedBy } = req.body;


const { uploadedBy } = req.body;

const approvalPositionValues = Array.isArray(req.body.approvalPositions)
    ? req.body.approvalPositions
    : [req.body.approvalPositions];

const documentNoteValues = Array.isArray(req.body.documentNotes)
    ? req.body.documentNotes
    : [req.body.documentNotes];

const approverEmailValues = Array.isArray(req.body.approverEmails)
    ? req.body.approverEmails
    : [req.body.approverEmails];
const approvalBoxConfigValues = Array.isArray(req.body.approvalBoxConfig)
    ? req.body.approvalBoxConfig
    : [req.body.approvalBoxConfig];

const approversByFile = approverEmailValues.map((value) => {
    try {
        const parsedValue = JSON.parse(value);
        return Array.isArray(parsedValue) ? parsedValue : [parsedValue];
    } catch {
        return [value];
    }
});

const approvalPositionsByFile = approvalPositionValues.map((value) => {
    try {
        const parsedValue = JSON.parse(value);
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
        return [];
    }
});

const documentNotesByFile = documentNoteValues.map((value) => {
    return typeof value === "string" ? value.trim() : "";
});

const approvalBoxesByFile = approvalBoxConfigValues.map((value) => {
    try {
        const parsedValue = JSON.parse(value);
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
        return [];
    }
});

if (approversByFile.length !== req.files.length) {
    return res.status(400).json({
        success: false,
        message: "Each uploaded file must have at least one approver.",
    });
}

if (approvalBoxesByFile.length !== req.files.length) {
    return res.status(400).json({
        success: false,
        message: "Each uploaded file must include its approval box layout.",
    });
}

if (approvalPositionValues.length !== req.files.length) {
    return res.status(400).json({
        success: false,
        message: "Each uploaded file must include its approval position.",
    });
}

if (approvalBoxesByFile.some((approvalBoxes) => !Array.isArray(approvalBoxes) || approvalBoxes.length === 0)) {
    return res.status(400).json({
        success: false,
        message: "Please place the approval box on every document before uploading.",
    });
}

const uploadedFiles = [];
console.log("BODY :", req.body);
console.log("Approver Emails :", approversByFile);

for (let i = 0; i < req.files.length; i++) {

    const file = req.files[i];

    console.log("=====================");
    console.log("Uploaded File Name :", file.filename);
    console.log("Uploaded File Path :", file.path);
    console.log("File Exists :", fs.existsSync(file.path));
    console.log("=====================");

    uploadedFiles.push({
        originalName: file.originalname,
        fileName: file.filename,
        fileType: file.mimetype,
        size: file.size,
        path: file.path,
    });

    const approvalGroupId = `${Date.now()}-${i}-${file.filename}`;

 const uploadedByUser = await pool.query(
    "SELECT id FROM users WHERE email=$1",
    [uploadedBy]
);
if (uploadedByUser.rows.length === 0) {
    throw new Error("Uploaded user not found.");
}

const documentResult = await pool.query(
    `
    INSERT INTO documents
    (
        user_id,
        original_name,
        stored_name,
        file_path,
        status,
        uploaded_at
    )
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    RETURNING id
    `,
    [
        uploadedByUser.rows[0].id,
        file.originalname,
        file.filename,
        file.path,
        "Pending",
    ]
);

const documentId = documentResult.rows[0].id;

const documentNote = documentNotesByFile[i] || "";

await pool.query(
    `
    INSERT INTO document_notes
    (
        document_id,
        note
    )
    VALUES ($1, $2)
    `,
    [
        documentId,
        documentNote,
    ]
);

const positions = approvalPositionsByFile[i] || [];

for (const position of positions) {
    await pool.query(
        `
        INSERT INTO document_approval_positions
        (
            document_id,
            page_number,
            x,
            y,
            width,
            height
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
            documentId,
            position.pageNumber || 1,
            position.x,
            position.y,
            position.width,
            position.height,
        ]
    );
}

for (let approvalIndex = 0; approvalIndex < approversByFile[i].length; approvalIndex++) {
        const approverEmail = approversByFile[i][approvalIndex];
        const approverUser = await pool.query(
            "SELECT id FROM users WHERE email=$1",
            [approverEmail]
        );

        if (approverUser.rows.length === 0) {
            throw new Error(`Approver not found: ${approverEmail}`);
        }

        await pool.query(
            `
            INSERT INTO document_assignments
            (
                original_file_name,
                stored_file_name,
                uploaded_by,
                assigned_to,
                approval_group_id,
                approval_box_config,
                approval_order,
                status
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8)
            `,
            [
                file.originalname,
                file.filename,
                uploadedByUser.rows[0].id,
                approverUser.rows[0].id,
                approvalGroupId,
                JSON.stringify(approvalBoxesByFile[i]),
                approvalIndex + 1,
                "Pending",
            ]
        );
    }
}

        return res.status(200).json({
            success: true,
            message: "Files uploaded successfully.",
            totalFiles: uploadedFiles.length,
            files: uploadedFiles,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;
