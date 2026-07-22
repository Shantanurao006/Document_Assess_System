const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

require("dotenv").config();

const authRoute = require("./routes/auth.route");
const uploadRoutes = require("./routes/upload.routes");
const approverRoute = require("./routes/approver.route");
const adminRoute = require("./routes/admin.route");

const app = express();

// Middlewares
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// Health Check API
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Document Approval System Backend is Running 🚀"
    });
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api", uploadRoutes);
app.use("/api/approver", approverRoute);
app.use("/api/admin", adminRoute);

// Invalid Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Not Found"
    });
});

module.exports = app;