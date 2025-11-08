const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Task = require("../models/Task");
const PMProject = require("../models/PMProject");
const Team = require("../models/Team");

// Helper function to calculate task progress from subtasks
const calculateTaskProgress = async (taskId) => {
  const task = await Task.findById(taskId).populate("subtasks");
  if (!task || !task.subtasks || task.subtasks.length === 0) {
    return task?.progress || 0;
  }

  const completedSubtasks = task.subtasks.filter(
    (st) => st.status === "completed"
  ).length;
  const progress = Math.round(
    (completedSubtasks / task.subtasks.length) * 100
  );
  return progress;
};

// Helper function to calculate PM project progress from tasks
const calculatePMProjectProgress = async (pmProjectId) => {
  const pmProject = await PMProject.findById(pmProjectId).populate("tasks");
  if (!pmProject || !pmProject.tasks || pmProject.tasks.length === 0) {
    return 0;
  }

  const topLevelTasks = pmProject.tasks.filter((t) => !t.parentTask);
  if (topLevelTasks.length === 0) {
    return 0;
  }

  const completedTasks = topLevelTasks.filter(
    (t) => t.status === "completed"
  ).length;
  const progress = Math.round((completedTasks / topLevelTasks.length) * 100);
  return progress;
};

// ========================
// Get all tasks for PM project
// ========================
router.get("/pm-project/:pmProjectId", auth, async (req, res) => {
  try {
    const pmProject = await PMProject.findById(req.params.pmProjectId);

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

    const tasks = await Task.find({ pmProject: req.params.pmProjectId })
      .populate("assignee", "username email avatar")
      .populate("createdBy", "username email avatar")
      .populate({
        path: "subtasks",
        populate: { path: "assignee", select: "username email avatar" },
      })
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ========================
// Create task
// ========================
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      pmProjectId,
      parentTaskId,
      priority,
      assigneeId,
      dueDate,
    } = req.body;

    const pmProject = await PMProject.findById(pmProjectId);
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

    // If parent task, verify it exists and belongs to same PM project
    if (parentTaskId) {
      const parentTask = await Task.findById(parentTaskId);
      if (!parentTask) {
        return res.status(404).json({ error: "Parent task not found" });
      }
      if (!parentTask.pmProject.equals(pmProjectId)) {
        return res
          .status(400)
          .json({ error: "Parent task must be in same PM project" });
      }
    }

    const task = new Task({
      title,
      description: description || "",
      pmProject: pmProjectId,
      parentTask: parentTaskId || null,
      priority: priority || "medium",
      assignee: assigneeId || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    await task.save();

    // If subtask, add to parent task's subtasks array
    if (parentTaskId) {
      await Task.findByIdAndUpdate(parentTaskId, {
        $addToSet: { subtasks: task._id },
      });
      // Recalculate parent task progress
      const parentProgress = await calculateTaskProgress(parentTaskId);
      await Task.findByIdAndUpdate(parentTaskId, { progress: parentProgress });
    } else {
      // Add to PM project's tasks array
      await PMProject.findByIdAndUpdate(pmProjectId, {
        $addToSet: { tasks: task._id },
      });
    }

    // Recalculate PM project progress
    const pmProgress = await calculatePMProjectProgress(pmProjectId);
    await PMProject.findByIdAndUpdate(pmProjectId, { progress: pmProgress });

    await task.populate([
      { path: "assignee", select: "username email avatar" },
      { path: "createdBy", select: "username email avatar" },
    ]);

    res.status(201).json({ task, message: "Task created successfully" });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ========================
// Update task
// ========================
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      assigneeId,
      dueDate,
      status,
    } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user is team member
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    const pmProject = await PMProject.findById(task.pmProject);
    const teamId = pmProject.team._id || pmProject.team;
    if (!user.teams || !user.teams.some((t) => t.equals(teamId))) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (assigneeId !== undefined) task.assignee = assigneeId || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (status) {
      task.status = status;
      // If completed, set progress to 100
      if (status === "completed") {
        task.progress = 100;
      }
    }

    await task.save();

    // Recalculate parent task progress if this is a subtask
    if (task.parentTask) {
      const parentProgress = await calculateTaskProgress(task.parentTask);
      await Task.findByIdAndUpdate(task.parentTask, { progress: parentProgress });
    }

    // Recalculate PM project progress
    const pmProgress = await calculatePMProjectProgress(task.pmProject);
    await PMProject.findByIdAndUpdate(task.pmProject, { progress: pmProgress });

    await task.populate([
      { path: "assignee", select: "username email avatar" },
      { path: "createdBy", select: "username email avatar" },
      {
        path: "subtasks",
        populate: { path: "assignee", select: "username email avatar" },
      },
    ]);

    res.json({ task, message: "Task updated successfully" });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ========================
// Delete task
// ========================
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user is team member
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    const pmProject = await PMProject.findById(task.pmProject);
    const teamId = pmProject.team._id || pmProject.team;
    if (!user.teams || !user.teams.some((t) => t.equals(teamId))) {
      return res.status(403).json({ error: "Access denied" });
    }

    const pmProjectId = task.pmProject;
    const parentTaskId = task.parentTask;

    // Delete all subtasks first
    if (task.subtasks && task.subtasks.length > 0) {
      await Task.deleteMany({ _id: { $in: task.subtasks } });
    }

    // Remove from parent task's subtasks if it's a subtask
    if (parentTaskId) {
      await Task.findByIdAndUpdate(parentTaskId, {
        $pull: { subtasks: task._id },
      });
      // Recalculate parent task progress
      const parentProgress = await calculateTaskProgress(parentTaskId);
      await Task.findByIdAndUpdate(parentTaskId, { progress: parentProgress });
    } else {
      // Remove from PM project's tasks array
      await PMProject.findByIdAndUpdate(pmProjectId, {
        $pull: { tasks: task._id },
      });
    }

    // Delete the task
    await task.deleteOne();

    // Recalculate PM project progress
    const pmProgress = await calculatePMProjectProgress(pmProjectId);
    await PMProject.findByIdAndUpdate(pmProjectId, { progress: pmProgress });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ========================
// Update task status
// ========================
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user is team member
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    const pmProject = await PMProject.findById(task.pmProject);
    const teamId = pmProject.team._id || pmProject.team;
    if (!user.teams || !user.teams.some((t) => t.equals(teamId))) {
      return res.status(403).json({ error: "Access denied" });
    }

    task.status = status;
    if (status === "completed") {
      task.progress = 100;
    }

    await task.save();

    // Recalculate parent task progress if this is a subtask
    if (task.parentTask) {
      const parentProgress = await calculateTaskProgress(task.parentTask);
      await Task.findByIdAndUpdate(task.parentTask, { progress: parentProgress });
    }

    // Recalculate PM project progress
    const pmProgress = await calculatePMProjectProgress(task.pmProject);
    await PMProject.findByIdAndUpdate(task.pmProject, { progress: pmProgress });

    await task.populate([
      { path: "assignee", select: "username email avatar" },
      { path: "createdBy", select: "username email avatar" },
    ]);

    res.json({ task, message: "Task status updated successfully" });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// ========================
// Assign task to user
// ========================
router.patch("/:id/assignee", auth, async (req, res) => {
  try {
    const { assigneeId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user is team member
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    const pmProject = await PMProject.findById(task.pmProject);
    const teamId = pmProject.team._id || pmProject.team;
    if (!user.teams || !user.teams.some((t) => t.equals(teamId))) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Verify assignee is team member if provided
    if (assigneeId) {
      const assignee = await User.findById(assigneeId);
      if (!assignee || !assignee.teams || !assignee.teams.some((t) => t.equals(teamId))) {
        return res.status(400).json({ error: "Assignee must be a team member" });
      }
    }

    task.assignee = assigneeId || null;
    await task.save();

    await task.populate([
      { path: "assignee", select: "username email avatar" },
      { path: "createdBy", select: "username email avatar" },
    ]);

    res.json({ task, message: "Task assignee updated successfully" });
  } catch (error) {
    console.error("Update task assignee error:", error);
    res.status(500).json({ error: "Failed to update task assignee" });
  }
});

module.exports = router;

