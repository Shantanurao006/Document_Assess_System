const fs = require("fs");
const path = require("path");

// Render mounts the persistent disk here
const BASE_UPLOAD_PATH =
    process.env.RENDER
        ? "/var/data"
        : path.join(__dirname, "..");

// Main upload directory
const uploadsDir =
    process.env.UPLOAD_DIR ||
    path.join(BASE_UPLOAD_PATH, "uploads");

// Signature images
const signaturesDir = path.join(uploadsDir, "signatures");

// Signed PDFs
const signedDir = path.join(uploadsDir, "signed");

const ensureUploadDirectories = () => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.mkdirSync(signaturesDir, { recursive: true });
    fs.mkdirSync(signedDir, { recursive: true });
};

module.exports = {
    uploadsDir,
    signaturesDir,
    signedDir,
    ensureUploadDirectories,
};