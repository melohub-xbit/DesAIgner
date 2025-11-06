const mongoose = require("mongoose");

const elementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["rectangle", "circle", "text", "image", "line", "polygon"],
    },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 100 },
    rotation: { type: Number, default: 0 },
    scaleX: { type: Number, default: 1 },
    scaleY: { type: Number, default: 1 },
    fill: { type: String, default: "#000000" },
    stroke: { type: String, default: "#000000" },
    strokeWidth: { type: Number, default: 0 },
    opacity: { type: Number, default: 1 },
    text: { type: String, default: "" },
    fontSize: { type: Number, default: 16 },
    fontFamily: { type: String, default: "Arial" },
    src: { type: String, default: "" },
    points: [Number],
    zIndex: { type: Number, default: 0 },
    locked: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["viewer", "editor", "admin"],
          default: "editor",
        },
      },
    ],
    elements: [elementSchema],
    canvasSettings: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 },
      backgroundColor: { type: String, default: "#ffffff" },
      gridEnabled: { type: Boolean, default: true },
      snapToGrid: { type: Boolean, default: false },
    },
    thumbnail: {
      type: String,
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ "collaborators.user": 1 });

module.exports = mongoose.model("Project", projectSchema);
