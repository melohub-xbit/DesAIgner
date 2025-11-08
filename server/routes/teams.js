const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Team = require("../models/Team");
const User = require("../models/User");
const PMProject = require("../models/PMProject");
const Project = require("../models/Project");

// ========================
// Get user's teams
// ========================
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("teams");
    if (!user.teams || user.teams.length === 0) {
      return res.json({ teams: [] });
    }

    const teams = await Team.find({ _id: { $in: user.teams } })
      .populate("owner", "username email avatar")
      .populate("members.user", "username email avatar")
      .populate("pmProjects");

    res.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// ========================
// Create team
// ========================
router.post("/", auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    const user = await User.findById(req.user._id);

    const team = new Team({
      name,
      description: description || "",
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "admin", // Owner is admin
        },
      ],
    });

    await team.save();

    // Add team to user's teams array
    if (!user.teams) {
      user.teams = [];
    }
    user.teams.push(team._id);
    await user.save();

    await team.populate([
      { path: "owner", select: "username email avatar" },
      { path: "members.user", select: "username email avatar" },
    ]);

    res.status(201).json({ team, message: "Team created successfully" });
  } catch (error) {
    console.error("Create team error:", error);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// ========================
// Get team details
// ========================
router.get("/:id", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("owner", "username email avatar")
      .populate("members.user", "username email avatar")
      .populate("pmProjects");

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if user is member or owner
    const isMember =
      team.owner.equals(req.user._id) ||
      team.members.some((m) => m.user.equals(req.user._id));

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ team });
  } catch (error) {
    console.error("Get team details error:", error);
    res.status(500).json({ error: "Failed to fetch team details" });
  }
});

// ========================
// Update team
// ========================
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Only owner or admin can update
    const isOwner = team.owner.equals(req.user._id);
    const isAdmin = team.members.some(
      (m) => m.user.equals(req.user._id) && m.role === "admin"
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();

    await team.populate([
      { path: "owner", select: "username email avatar" },
      { path: "members.user", select: "username email avatar" },
    ]);

    res.json({ team, message: "Team updated successfully" });
  } catch (error) {
    console.error("Update team error:", error);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// ========================
// Invite member by email
// ========================
router.post("/:id/members", auth, async (req, res) => {
  try {
    const { email, role } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Only owner or admin can invite
    const isOwner = team.owner.equals(req.user._id);
    const isAdmin = team.members.some(
      (m) => m.user.equals(req.user._id) && m.role === "admin"
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const newMember = await User.findOne({ email });
    if (!newMember) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already a member
    const alreadyMember = team.members.some((m) =>
      m.user.equals(newMember._id)
    );
    if (alreadyMember) {
      return res.status(400).json({ error: "User already a member" });
    }

    team.members.push({
      user: newMember._id,
      role: role || "member",
    });

    await team.save();

    // Add team to user's teams array if not already present
    if (!newMember.teams) {
      newMember.teams = [];
    }
    if (!newMember.teams.some((t) => t.equals(team._id))) {
      newMember.teams.push(team._id);
      await newMember.save();
    }

    await team.populate([
      { path: "owner", select: "username email avatar" },
      { path: "members.user", select: "username email avatar" },
    ]);

    res.json({ team, message: "Member added successfully" });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// ========================
// Remove member
// ========================
router.delete("/:id/members/:memberId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Only owner or admin can remove
    const isOwner = team.owner.equals(req.user._id);
    const isAdmin = team.members.some(
      (m) => m.user.equals(req.user._id) && m.role === "admin"
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Cannot remove owner
    if (team.owner.equals(req.params.memberId)) {
      return res.status(400).json({ error: "Cannot remove team owner" });
    }

    const memberIndex = team.members.findIndex((m) =>
      m.user.equals(req.params.memberId)
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found" });
    }

    team.members.splice(memberIndex, 1);
    await team.save();

    // Remove team reference from user's teams array
    const memberUser = await User.findById(req.params.memberId);
    if (memberUser && memberUser.teams) {
      memberUser.teams = memberUser.teams.filter(
        (t) => !t.equals(team._id)
      );
      await memberUser.save();
    }

    await team.populate([
      { path: "owner", select: "username email avatar" },
      { path: "members.user", select: "username email avatar" },
    ]);

    res.json({ team, message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// ========================
// Create/assign PM project to design project
// ========================
router.post("/:id/pm-project", auth, async (req, res) => {
  try {
    const { designProjectId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Only owner or admin can create PM project
    const isOwner = team.owner.equals(req.user._id);
    const isAdmin = team.members.some(
      (m) => m.user.equals(req.user._id) && m.role === "admin"
    );

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Verify design project exists and user has access
    const designProject = await Project.findById(designProjectId);
    if (!designProject) {
      return res.status(404).json({ error: "Design project not found" });
    }

    const hasAccess =
      designProject.owner.equals(req.user._id) ||
      designProject.collaborators.some((c) => c.user.equals(req.user._id));

    if (!hasAccess) {
      return res
        .status(403)
        .json({ error: "No access to this design project" });
    }

    // Check if design project already has a PM project
    const existingPMProject = await PMProject.findOne({
      designProject: designProjectId,
    });
    if (existingPMProject) {
      return res
        .status(400)
        .json({ error: "Design project already has a PM project" });
    }

    // Create PM project
    const pmProject = new PMProject({
      name: designProject.name + " - PM",
      description: `Project management for ${designProject.name}`,
      designProject: designProjectId,
      team: team._id,
      status: "planning",
    });

    await pmProject.save();

    // Add PM project to team's pmProjects array
    if (!team.pmProjects) {
      team.pmProjects = [];
    }
    team.pmProjects.push(pmProject._id);
    await team.save();

    await pmProject.populate([
      { path: "designProject", select: "name description" },
      { path: "team", select: "name" },
    ]);

    res.status(201).json({
      pmProject,
      message: "PM project created successfully",
    });
  } catch (error) {
    console.error("Create PM project error:", error);
    res.status(500).json({ error: "Failed to create PM project" });
  }
});

module.exports = router;

