const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
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
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["member", "admin"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pmProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PMProject",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
teamSchema.index({ owner: 1 });
teamSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Team", teamSchema);

