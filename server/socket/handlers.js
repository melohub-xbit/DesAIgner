// handlers.js
const jwt = require("jsonwebtoken");
const Project = require("../models/Project");
const User = require("../models/User");
const PMProject = require("../models/PMProject");
const Team = require("../models/Team");

// Track active users per project room
const activeUsers = new Map();
// Track active users per PM project room
const activePMUsers = new Map();

const formatActiveUsersForBroadcast = (projectId) => {
  if (!activeUsers.has(projectId)) {
    return [];
  }
  return Array.from(activeUsers.get(projectId).entries()).map(
    ([socketId, data]) => ({ socketId, ...data })
  );
};

const broadcastActiveUsers = (io, projectId) => {
  io.to(projectId).emit(
    "active-users",
    formatActiveUsersForBroadcast(projectId)
  );
};

const setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Securely join a project room
    socket.on("join-project", async ({ projectId, token }) => {
      try {
        if (!token) return socket.emit("error", { error: "Missing token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return socket.emit("error", { error: "User not found" });

        const project = await Project.findById(projectId);
        if (!project)
          return socket.emit("error", { error: "Project not found" });

        const allowed =
          project.owner.equals(user._id) ||
          project.collaborators.some((c) => c.user.equals(user._id)) ||
          project.isPublic;

        if (!allowed) return socket.emit("error", { error: "Access denied" });

        // Join room
        socket.join(projectId);

        // Add user to active users list
        if (!activeUsers.has(projectId)) {
          activeUsers.set(projectId, new Map());
        }
        activeUsers.get(projectId).set(socket.id, {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          cursor: { x: 0, y: 0 },
        });

        // Notify others
        socket.to(projectId).emit("user-joined", {
          socketId: socket.id,
          user: {
            id: user._id,
            username: user.username,
            avatar: user.avatar,
          },
        });

        // Broadcast updated active users list to room
        broadcastActiveUsers(io, projectId);

        console.log(`✅ ${user.username} joined project ${projectId}`);
      } catch (err) {
        console.error("Join-project error:", err);
        socket.emit("error", { error: "Invalid or expired token" });
      }
    });

    // Leave project room
    socket.on("leave-project", ({ projectId }) => {
      handleUserLeave(io, socket, projectId);
    });

    // Element operations
    socket.on("element-add", async ({ projectId, element }) => {
      try {
        socket.to(projectId).emit("element-added", {
          element,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Element add error:", error);
      }
    });

    socket.on("element-update", async ({ projectId, element }) => {
      try {
        socket.to(projectId).emit("element-updated", {
          element,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Element update error:", error);
      }
    });

    socket.on("element-delete", async ({ projectId, elementId }) => {
      try {
        socket.to(projectId).emit("element-deleted", {
          elementId,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Element delete error:", error);
      }
    });

    // Bulk update
    socket.on("elements-update", async ({ projectId, elements }) => {
      try {
        socket.to(projectId).emit("elements-updated", {
          elements,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Elements update error:", error);
      }
    });

    // Cursor movement
    socket.on("cursor-move", ({ projectId, position }) => {
      try {
        if (
          activeUsers.has(projectId) &&
          activeUsers.get(projectId).has(socket.id)
        ) {
          const user = activeUsers.get(projectId).get(socket.id);
          user.cursor = position;
          socket.to(projectId).emit("cursor-moved", {
            socketId: socket.id,
            user,
            position,
          });
        }
      } catch (error) {
        console.error("Cursor move error:", error);
      }
    });

    // Selection synchronization
    socket.on("selection-change", ({ projectId, selectedIds }) => {
      try {
        socket.to(projectId).emit("user-selection-changed", {
          socketId: socket.id,
          selectedIds,
        });
      } catch (error) {
        console.error("Selection change error:", error);
      }
    });

    // Canvas settings updates
    socket.on("canvas-update", ({ projectId, settings }) => {
      try {
        socket.to(projectId).emit("canvas-updated", {
          settings,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Canvas update error:", error);
      }
    });

    // ========================
    // PM Project Collaboration
    // ========================

    // Join PM project room
    socket.on("join-pm-project", async ({ pmProjectId, token }) => {
      try {
        if (!token) return socket.emit("error", { error: "Missing token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return socket.emit("error", { error: "User not found" });

        const pmProject = await PMProject.findById(pmProjectId);
        if (!pmProject)
          return socket.emit("error", { error: "PM project not found" });

        // Check if user is team member
        if (!user.team || !user.team.equals(pmProject.team)) {
          return socket.emit("error", { error: "Access denied" });
        }

        // Join room
        socket.join(pmProjectId);

        // Add user to active PM users list
        if (!activePMUsers.has(pmProjectId)) {
          activePMUsers.set(pmProjectId, new Map());
        }
        activePMUsers.get(pmProjectId).set(socket.id, {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
        });

        // Notify others
        socket.to(pmProjectId).emit("pm-user-joined", {
          socketId: socket.id,
          user: {
            id: user._id,
            username: user.username,
            avatar: user.avatar,
          },
        });

        // Broadcast updated active users list
        broadcastActivePMUsers(io, pmProjectId);

        console.log(`✅ ${user.username} joined PM project ${pmProjectId}`);
      } catch (err) {
        console.error("Join-pm-project error:", err);
        socket.emit("error", { error: "Invalid or expired token" });
      }
    });

    // Leave PM project room
    socket.on("leave-pm-project", ({ pmProjectId }) => {
      handlePMUserLeave(io, socket, pmProjectId);
    });

    // Task operations
    socket.on("task-create", async ({ pmProjectId, task }) => {
      try {
        socket.to(pmProjectId).emit("task-created", {
          task,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Task create error:", error);
      }
    });

    socket.on("task-update", async ({ pmProjectId, task }) => {
      try {
        socket.to(pmProjectId).emit("task-updated", {
          task,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Task update error:", error);
      }
    });

    socket.on("task-delete", async ({ pmProjectId, taskId }) => {
      try {
        socket.to(pmProjectId).emit("task-deleted", {
          taskId,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Task delete error:", error);
      }
    });

    socket.on("task-status-change", async ({ pmProjectId, taskId, status }) => {
      try {
        socket.to(pmProjectId).emit("task-status-changed", {
          taskId,
          status,
          userId: socket.id,
        });
      } catch (error) {
        console.error("Task status change error:", error);
      }
    });

    socket.on("pm-project-update", async ({ pmProjectId, pmProject }) => {
      try {
        socket.to(pmProjectId).emit("pm-project-updated", {
          pmProject,
          userId: socket.id,
        });
      } catch (error) {
        console.error("PM project update error:", error);
      }
    });

    // Handle disconnects
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      activeUsers.forEach((users, projectId) => {
        if (users.has(socket.id)) {
          handleUserLeave(io, socket, projectId);
        }
      });
      activePMUsers.forEach((users, pmProjectId) => {
        if (users.has(socket.id)) {
          handlePMUserLeave(io, socket, pmProjectId);
        }
      });
    });
  });
};

// Utility to remove user cleanly
const handleUserLeave = (io, socket, projectId) => {
  if (activeUsers.has(projectId)) {
    const user = activeUsers.get(projectId).get(socket.id);
    activeUsers.get(projectId).delete(socket.id);

    if (activeUsers.get(projectId).size === 0) {
      activeUsers.delete(projectId);
    }

    socket.to(projectId).emit("user-left", { socketId: socket.id, user });
    socket.leave(projectId);
    broadcastActiveUsers(io, projectId);
    console.log(`User left project ${projectId}`);
  }
};

// PM Project utilities
const formatActivePMUsersForBroadcast = (pmProjectId) => {
  if (!activePMUsers.has(pmProjectId)) {
    return [];
  }
  return Array.from(activePMUsers.get(pmProjectId).entries()).map(
    ([socketId, data]) => ({ socketId, ...data })
  );
};

const broadcastActivePMUsers = (io, pmProjectId) => {
  io.to(pmProjectId).emit(
    "pm-active-users",
    formatActivePMUsersForBroadcast(pmProjectId)
  );
};

const handlePMUserLeave = (io, socket, pmProjectId) => {
  if (activePMUsers.has(pmProjectId)) {
    const user = activePMUsers.get(pmProjectId).get(socket.id);
    activePMUsers.get(pmProjectId).delete(socket.id);

    if (activePMUsers.get(pmProjectId).size === 0) {
      activePMUsers.delete(pmProjectId);
    }

    socket.to(pmProjectId).emit("pm-user-left", {
      socketId: socket.id,
      user,
    });
    socket.leave(pmProjectId);
    broadcastActivePMUsers(io, pmProjectId);
    console.log(`User left PM project ${pmProjectId}`);
  }
};

module.exports = { setupSocketHandlers };
