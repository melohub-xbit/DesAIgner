const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const Asset = require("../models/Asset");
const auth = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "uploads/assets";
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// Upload asset
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { projectId, tags } = req.body;

    // Get image dimensions
    const metadata = await sharp(req.file.path).metadata();

    // Create thumbnail
    const thumbnailPath = req.file.path.replace(
      path.extname(req.file.path),
      "_thumb" + path.extname(req.file.path)
    );

    await sharp(req.file.path)
      .resize(200, 200, { fit: "inside" })
      .toFile(thumbnailPath);

    const asset = new Asset({
      name: req.file.originalname,
      type: "image",
      url: `/uploads/assets/${req.file.filename}`,
      thumbnail: `/uploads/assets/${path.basename(thumbnailPath)}`,
      size: req.file.size,
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
      mimeType: req.file.mimetype,
      owner: req.user._id,
      project: projectId || null,
      tags: tags ? JSON.parse(tags) : [],
    });

    await asset.save();

    res.status(201).json({ asset, message: "Asset uploaded successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload asset" });
  }
});

// Get user assets
router.get("/", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = { owner: req.user._id };

    if (projectId) {
      query.project = projectId;
    }

    const assets = await Asset.find(query).sort({ createdAt: -1 });
    res.json({ assets });
  } catch (error) {
    console.error("Get assets error:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

// Update asset metadata
router.patch("/:id", auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    if (!asset.owner.equals(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, tags, projectId } = req.body;

    if (typeof name === "string" && name.trim()) {
      asset.name = name.trim().slice(0, 120);
    }

    if (Array.isArray(tags)) {
      asset.tags = tags.map((tag) => String(tag).trim()).filter(Boolean);
    }

    if (projectId !== undefined) {
      asset.project = projectId || null;
    }

    await asset.save();

    res.json({ asset, message: "Asset updated successfully" });
  } catch (error) {
    console.error("Update asset error:", error);
    res.status(500).json({ error: "Failed to update asset" });
  }
});

// Delete asset
router.delete("/:id", auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    if (!asset.owner.equals(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete files
    const assetPath = path.join(__dirname, "..", asset.url);
    const thumbnailPath = path.join(__dirname, "..", asset.thumbnail);

    try {
      await fs.unlink(assetPath);
      await fs.unlink(thumbnailPath);
    } catch (err) {
      console.error("File deletion error:", err);
    }

    await asset.deleteOne();
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    res.status(500).json({ error: "Failed to delete asset" });
  }
});

module.exports = router;
