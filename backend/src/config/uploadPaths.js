const fs = require("fs");
const path = require("path");

const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
const signaturesDir = path.join(uploadsDir, "signatures");
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
