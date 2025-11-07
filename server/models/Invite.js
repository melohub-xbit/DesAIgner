const mongoose = require("mongoose");
const inviteSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    inviter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inviteeEmail: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["viewer", "editor", "admin"], default: "editor" },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "accepted", "declined", "expired"], default: "pending" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
inviteSchema.index({ token: 1 }, { unique: true });
inviteSchema.index({ inviteeEmail: 1, project: 1, status: 1 });
module.exports = mongoose.model("Invite", inviteSchema);
