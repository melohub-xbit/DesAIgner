const mongoose = require("mongoose");

const inviteCodeSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  code: { type: String, required: true, unique: true },
  role: { type: String, enum: ["viewer", "editor", "admin"], default: "editor" },
  createdAt: { type: Date, default: Date.now, expires: "1d" }, // auto-delete after 1 day
});

module.exports = mongoose.model("InviteCode", inviteCodeSchema);
