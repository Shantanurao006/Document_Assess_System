const multer = require("multer");
const path = require("path");
const { ensureUploadDirectories, signaturesDir } = require("../config/uploadPaths");

ensureUploadDirectories();

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, signaturesDir);
    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname);

        cb(
            null,
            "signature_" + Date.now() + extension
        );

    }

});

module.exports = multer({
    storage
});
