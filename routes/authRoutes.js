const express = require("express");
const multer = require("multer");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file name
  },
});

const upload = multer({ storage });

// 🛡️ Authentication Routes
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/user", authMiddleware, authController.getAuthenticatedUser);

// 📂 File Upload Route
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    message: "File uploaded successfully",
    fileName: req.file.filename,
    filePath: `/uploads/${req.file.filename}`,
  });
});

// 🚀 Export Router
module.exports = router;
