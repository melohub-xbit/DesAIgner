const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const PMProject = require("../models/PMProject");
const Team = require("../models/Team");
const Task = require("../models/Task");

// ========================
// Get user's PM projects (via teams)
// ========================
router.get("/", auth, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id).populate("teams");

    if (!user.teams || user.teams.length === 0) {
      return res.json({ pmProjects: [] });
    }

    const teams = await Team.find({ _id: { $in: user.teams } }).populate("pmProjects");
    
    // Collect all PM projects from all teams
    const pmProjectIds = [];
    teams.forEach((team) => {
      if (team.pmProjects && team.pmProjects.length > 0) {
        pmProjectIds.push(...team.pmProjects);
      }
    });

    if (pmProjectIds.length === 0) {
      return res.json({ pmProjects: [] });
    }

    const pmProjects = await PMProject.find({ _id: { $in: pmProjectIds } })
      .populate("designProject", "name description thumbnail")
      .populate("team", "name owner members")
      .populate("tasks");

    res.json({ pmProjects });
  } catch (error) {
    console.error("Get PM projects error:", error);
    res.status(500).json({ error: "Failed to fetch PM projects" });
  }
});

// ========================
// Get PM project with tasks
// ========================
router.get("/:id", auth, async (req, res) => {
  try {
    const pmProject = await PMProject.findById(req.params.id)
      .populate("designProject", "name description thumbnail")
      .populate("team", "name owner members")
      .populate({
        path: "tasks",
        populate: [
          { path: "assignee", select: "username email avatar" },
          { path: "createdBy", select: "username email avatar" },
          { path: "subtasks", populate: { path: "assignee", select: "username email avatar" } },
        ],
      });

    if (!pmProject) {
      return res.status(404).json({ error: "PM project not found" });
    }

    // Check if user is team member
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    const teamId = pmProject.team._id || pmProject.team;
    if (!user.teams || !user.teams.some((t) => t.equals(teamId))) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ pmProject });
  } catch (error) {
    console.error("Get PM project error:", error);
    res.status(500).json({ error: "Failed to fetch PM project" });
  }
});

// ========================
// Update PM project
// ========================
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description, status, startDate, endDate } = req.body;
    const pmProject = await PMProject.findById(req.params.id);

    if (!pmProject) {
      return res.status(404).json({ error: "PM project not found" });
    }

    // Check if user is team member
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    const teamId = pmProject.team._id || pmProject.team;
    if (!user.teams || !user.teams.some((t) => t.equals(teamId))) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (name) pmProject.name = name;
    if (description !== undefined) pmProject.description = description;
    if (status) pmProject.status = status;
    if (startDate) pmProject.startDate = startDate;
    if (endDate) pmProject.endDate = endDate;

    await pmProject.save();

    await pmProject.populate([
      { path: "designProject", select: "name description thumbnail" },
      { path: "team", select: "name owner members" },
    ]);

    res.json({ pmProject, message: "PM project updated successfully" });
  } catch (error) {
    console.error("Update PM project error:", error);
    res.status(500).json({ error: "Failed to update PM project" });
  }
});

// ========================
// Get PM project for design project
// ========================
router.get("/design/:designProjectId", auth, async (req, res) => {
  try {
    const pmProject = await PMProject.findOne({
      designProject: req.params.designProjectId,
    })
      .populate("designProject", "name description thumbnail")
      .populate("team", "name owner members")
      .populate({
        path: "tasks",
        populate: [
          { path: "assignee", select: "username email avatar" },
          { path: "createdBy", select: "username email avatar" },
          { path: "subtasks", populate: { path: "assignee", select: "username email avatar" } },
        ],
      });

    if (!pmProject) {
      return res.json({ pmProject: null });
    }

    // Check if user has access to design project
    const Project = require("../models/Project");
    const designProject = await Project.findById(req.params.designProjectId);
    if (!designProject) {
      return res.status(404).json({ error: "Design project not found" });
    }

    const hasAccess =
      designProject.owner.equals(req.user._id) ||
      designProject.collaborators.some((c) => c.user.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ pmProject });
  } catch (error) {
    console.error("Get PM project by design project error:", error);
    res.status(500).json({ error: "Failed to fetch PM project" });
  }
});

module.exports = router;

