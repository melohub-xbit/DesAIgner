// handlers.js
const jwt = require("jsonwebtoken");
const Project = require("../models/Project");
const User = require("../models/User");

// Track active users per project room
const activeUsers = new Map();

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

        if (!allowed)
          return socket.emit("error", { error: "Access denied" });

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

        // Send current active users list to new joiner
        const users = Array.from(activeUsers.get(projectId).values());
        socket.emit(
          "active-users",
          users.filter((u) => u.id.toString() !== user._id.toString())
        );

        console.log(`✅ ${user.username} joined project ${projectId}`);
      } catch (err) {
        console.error("Join-project error:", err);
        socket.emit("error", { error: "Invalid or expired token" });
      }
    });

    // Leave project room
    socket.on("leave-project", ({ projectId }) => {
      handleUserLeave(socket, projectId);
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

    // Handle disconnects
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      activeUsers.forEach((users, projectId) => {
        if (users.has(socket.id)) {
          handleUserLeave(socket, projectId);
        }
      });
    });
  });
};

// Utility to remove user cleanly
const handleUserLeave = (socket, projectId) => {
  if (activeUsers.has(projectId)) {
    const user = activeUsers.get(projectId).get(socket.id);
    activeUsers.get(projectId).delete(socket.id);

    if (activeUsers.get(projectId).size === 0) {
      activeUsers.delete(projectId);
    }

    socket.to(projectId).emit("user-left", { socketId: socket.id, user });
    socket.leave(projectId);
    console.log(`User left project ${projectId}`);
  }
};

module.exports = { setupSocketHandlers };