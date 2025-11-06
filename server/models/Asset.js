const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["image", "vector", "icon"],
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      required: true,
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    mimeType: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

assetSchema.index({ owner: 1, createdAt: -1 });
assetSchema.index({ project: 1 });

module.exports = mongoose.model("Asset", assetSchema);
