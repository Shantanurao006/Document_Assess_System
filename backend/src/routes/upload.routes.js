const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pool = require("../config/db");

const router = express.Router();

// Create uploads folder automatically if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
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

const approverEmails = Array.isArray(req.body.approverEmails)
    ? req.body.approverEmails
    : [req.body.approverEmails];

const uploadedFiles = [];
console.log("BODY :", req.body);
console.log("Approver Emails :", req.body.approverEmails);
console.log("Type :", typeof req.body.approverEmails);

for (let i = 0; i < req.files.length; i++) {

    const file = req.files[i];

    uploadedFiles.push({
        originalName: file.originalname,
        fileName: file.filename,
        fileType: file.mimetype,
        size: file.size,
        path: file.path,
    });

    const file = req.files[i];
    console.log("=====================");
console.log("Uploaded File Name :", file.filename);
console.log("Uploaded File Path :", file.path);
console.log("File Exists :", fs.existsSync(file.path));
console.log("=====================");

    const uploadedByUser = await pool.query(
        "SELECT id FROM users WHERE email=$1",
        [uploadedBy]
    );

    if (uploadedByUser.rows.length === 0) {
        throw new Error("Uploaded user not found.");
    }

    const approverUser = await pool.query(
        "SELECT id FROM users WHERE email=$1",
        [approverEmails[i]]
    );

    if (approverUser.rows.length === 0) {
        throw new Error("Approver not found.");
    }

    await pool.query(
        `
        INSERT INTO document_assignments
        (
            original_file_name,
            stored_file_name,
            uploaded_by,
            assigned_to,
            status
        )
        VALUES
        ($1,$2,$3,$4,$5)
        `,
        [
            file.originalname,
            file.filename,
            uploadedByUser.rows[0].id,
            approverUser.rows[0].id,
            "Pending",
        ]
    );
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