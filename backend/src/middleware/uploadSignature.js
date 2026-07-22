const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "src/uploads/signatures");
    },

    filename(req, file, cb) {
        const ext = path.extname(file.originalname);

        cb(
            null,
            `signature_${Date.now()}${ext}`
        );
    },
});

const upload = multer({
    storage,
});

module.exports = upload;