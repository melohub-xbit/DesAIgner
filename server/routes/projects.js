const express = require("express");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all user projects
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

// Get single project
router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "username email avatar")
      .populate("collaborators.user", "username email avatar");

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check access
    const hasAccess =
      project.owner._id.equals(req.user._id) ||
      project.collaborators.some((c) => c.user._id.equals(req.user._id)) ||
      project.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ project });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create project
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
    
    // Add project to user's projects array
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { projects: project._id },
    });
    
    await project.populate("owner", "username email avatar");

    res.status(201).json({ project, message: "Project created successfully" });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project
router.put("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check ownership or editor access
    const isOwner = project.owner.equals(req.user._id);
    const isEditor = project.collaborators.some(
      (c) =>
        c.user.equals(req.user._id) &&
        (c.role === "editor" || c.role === "admin")
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({ error: "Access denied" });
    }

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

// Delete project
router.delete("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ error: "Only owner can delete project" });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Add collaborator
router.post("/:id/collaborators", auth, async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!project.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Only owner can add collaborators" });
    }

    const User = require("../models/User");
    const collaborator = await User.findOne({ email });

    if (!collaborator) {
      return res.status(404).json({ error: "User not found" });
    }

    const alreadyCollaborator = project.collaborators.some((c) =>
      c.user.equals(collaborator._id)
    );

    if (alreadyCollaborator) {
      return res.status(400).json({ error: "User is already a collaborator" });
    }

    project.collaborators.push({
      user: collaborator._id,
      role: role || "editor",
    });
    await project.save();
    
    // Add project to collaborator's projects array
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
