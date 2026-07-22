const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const authRoute = require("./routes/auth.route");
const uploadRoutes = require("./routes/upload.routes");
const approverRoute = require("./routes/approver.route");
const adminRoute = require("./routes/admin.route");
const downloadRoute = require("./routes/download.route");
const documentRoute = require("./routes/document.route");

const app = express();

// ----------------------
// Middlewares
// ----------------------
app.use(cors());

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    })
);

app.use(morgan("dev"));

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

// ----------------------
// Uploads Directory
// ----------------------
const uploadsPath = path.join(__dirname, "uploads");

console.log("======================================");
console.log("Uploads Path :", uploadsPath);
console.log("Uploads Exists :", fs.existsSync(uploadsPath));

if (fs.existsSync(uploadsPath)) {
    console.log("Files inside uploads:");
    console.log(fs.readdirSync(uploadsPath));
} else {
    console.log("Uploads folder NOT FOUND");
}

console.log("======================================");

// ----------------------
// Serve Uploaded Files
// ----------------------
app.use("/uploads", express.static(uploadsPath));

// ----------------------
// Debug Route
// ----------------------
app.get("/uploads-test", (req, res) => {
    try {
        res.json({
            uploadsPath,
            exists: fs.existsSync(uploadsPath),
            files: fs.existsSync(uploadsPath)
                ? fs.readdirSync(uploadsPath)
                : [],
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});

// ----------------------
// Health Check
// ----------------------
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Document Approval System Backend is Running 🚀",
    });
});

// ----------------------
// Routes
// ----------------------
app.use("/api/auth", authRoute);
app.use("/api", uploadRoutes);
app.use("/api/approver", approverRoute);
app.use("/api/admin", adminRoute);
app.use("/api/document", downloadRoute);
app.use("/api/document", documentRoute);

// ----------------------
// 404 Handler
// ----------------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Not Found",
    });
});

module.exports = app;