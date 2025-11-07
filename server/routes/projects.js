const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const User = require("../models/User");
const InviteCode = require("../models/InviteCode");
const crypto = require("crypto");

// ========================
// Generate a collaboration code
// ========================
router.post("/:id/invite-code", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Only owner or admin can generate
    const isOwner = project.owner.equals(req.user._id);
    const isAdmin = project.collaborators.some(
      (c) => c.user.equals(req.user._id) && c.role === "admin"
    );
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: "Access denied" });

    // Generate short random code (e.g. "A4B9C1")
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    const invite = await InviteCode.create({
      project: project._id,
      code,
      role: "editor",
    });

    res.json({ code: invite.code, message: "Invite code generated" });
  } catch (err) {
    console.error("Invite code error:", err);
    res.status(500).json({ error: "Failed to generate invite code" });
  }
});

// ========================
// Redeem a collaboration code
// ========================
router.post("/join-with-code", auth, async (req, res) => {
  try {
    const { code } = req.body;
    const invite = await InviteCode.findOne({ code: code.toUpperCase() });
    if (!invite)
      return res.status(404).json({ error: "Invalid or expired code" });

    const project = await Project.findById(invite.project);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const already =
      project.collaborators.some((c) => c.user.equals(req.user._id)) ||
      project.owner.equals(req.user._id);

    if (!already) {
      project.collaborators.push({ user: req.user._id, role: invite.role });
      await project.save();
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { projects: project._id },
      });
    }

    // Optionally delete the code after use
    // await InviteCode.deleteOne({ _id: invite._id });

    res.json({
      message: "Joined project successfully",
      projectId: project._id,
      name: project.name,
    });
  } catch (err) {
    console.error("Join with code error:", err);
    res.status(500).json({ error: "Failed to join project" });
  }
});

// ========================
// Get all user projects
// ========================
router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
    })
      .populate("owner", "username email avatar")
      .populate("collaborators.user", "username email avatar")
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// ========================
// Get single project
// ========================
router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "username email avatar")
      .populate("collaborators.user", "username email avatar");

    if (!project)
      return res.status(404).json({ error: "Project not found" });

    const hasAccess =
      project.owner._id.equals(req.user._id) ||
      project.collaborators.some((c) => c.user._id.equals(req.user._id)) ||
      project.isPublic;

    if (!hasAccess)
      return res.status(403).json({ error: "Access denied" });

    res.json({ project });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// ========================
// Create new project
// ========================
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, canvasSettings } = req.body;

    const project = new Project({
      name,
      description,
      owner: req.user._id,
      canvasSettings: canvasSettings || {},
      elements: [],
    });

    await project.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { projects: project._id },
    });

    await project.populate("owner", "username email avatar");

    res
      .status(201)
      .json({ project, message: "Project created successfully" });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// ========================
// Update a project
// ========================
router.put("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ error: "Project not found" });

    const isOwner = project.owner.equals(req.user._id);
    const isEditor = project.collaborators.some(
      (c) =>
        c.user.equals(req.user._id) &&
        (c.role === "editor" || c.role === "admin")
    );

    if (!isOwner && !isEditor)
      return res.status(403).json({ error: "Access denied" });

    const { name, description, elements, canvasSettings, thumbnail } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (elements) project.elements = elements;
    if (canvasSettings)
      project.canvasSettings = { ...project.canvasSettings, ...canvasSettings };
    if (thumbnail) project.thumbnail = thumbnail;

    project.version += 1;
    await project.save();

    res.json({ project, message: "Project updated successfully" });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// ========================
// Delete a project
// ========================
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ error: "Project not found" });

    if (!project.owner.equals(req.user._id))
      return res.status(403).json({ error: "Only owner can delete project" });

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ========================
// Add collaborator manually (owner only)
// ========================
router.post("/:id/collaborators", auth, async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ error: "Project not found" });

    if (!project.owner.equals(req.user._id))
      return res.status(403).json({ error: "Only owner can add collaborators" });

    const collaborator = await User.findOne({ email });
    if (!collaborator)
      return res.status(404).json({ error: "User not found" });

    const already = project.collaborators.some((c) =>
      c.user.equals(collaborator._id)
    );
    if (already)
      return res.status(400).json({ error: "User already collaborator" });

    project.collaborators.push({
      user: collaborator._id,
      role: role || "editor",
    });
    await project.save();

    await User.findByIdAndUpdate(collaborator._id, {
      $addToSet: { projects: project._id },
    });

    await project.populate("collaborators.user", "username email avatar");

    res.json({ project, message: "Collaborator added successfully" });
  } catch (error) {
    console.error("Add collaborator error:", error);
    res.status(500).json({ error: "Failed to add collaborator" });
  }
});

module.exports = router;
