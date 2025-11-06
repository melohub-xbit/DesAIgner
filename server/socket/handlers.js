const Project = require("../models/Project");

// Active users per project room
const activeUsers = new Map();

const setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join project room
    socket.on("join-project", async ({ projectId, user }) => {
      try {
        socket.join(projectId);

        // Add user to active users
        if (!activeUsers.has(projectId)) {
          activeUsers.set(projectId, new Map());
        }
        activeUsers.get(projectId).set(socket.id, {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          cursor: { x: 0, y: 0 },
        });

        // Broadcast to room
        socket.to(projectId).emit("user-joined", {
          socketId: socket.id,
          user: {
            id: user._id,
            username: user.username,
            avatar: user.avatar,
          },
        });

        // Send current active users to new user
        const users = Array.from(activeUsers.get(projectId).values());
        socket.emit(
          "active-users",
          users.filter((u) => u.id !== user._id)
        );

        console.log(`User ${user.username} joined project ${projectId}`);
      } catch (error) {
        console.error("Join project error:", error);
      }
    });

    // Leave project room
    socket.on("leave-project", ({ projectId }) => {
      handleUserLeave(socket, projectId);
    });

    // Element operations
    socket.on("element-add", async ({ projectId, element }) => {
      try {
        socket
          .to(projectId)
          .emit("element-added", { element, userId: socket.id });
      } catch (error) {
        console.error("Element add error:", error);
      }
    });

    socket.on("element-update", async ({ projectId, element }) => {
      try {
        socket
          .to(projectId)
          .emit("element-updated", { element, userId: socket.id });
      } catch (error) {
        console.error("Element update error:", error);
      }
    });

    socket.on("element-delete", async ({ projectId, elementId }) => {
      try {
        socket
          .to(projectId)
          .emit("element-deleted", { elementId, userId: socket.id });
      } catch (error) {
        console.error("Element delete error:", error);
      }
    });

    // Bulk operations
    socket.on("elements-update", async ({ projectId, elements }) => {
      try {
        socket
          .to(projectId)
          .emit("elements-updated", { elements, userId: socket.id });
      } catch (error) {
        console.error("Elements update error:", error);
      }
    });

    // Cursor position
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
            user: user,
            position,
          });
        }
      } catch (error) {
        console.error("Cursor move error:", error);
      }
    });

    // Selection sync
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

    // Canvas settings update
    socket.on("canvas-update", ({ projectId, settings }) => {
      try {
        socket
          .to(projectId)
          .emit("canvas-updated", { settings, userId: socket.id });
      } catch (error) {
        console.error("Canvas update error:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove from all project rooms
      activeUsers.forEach((users, projectId) => {
        if (users.has(socket.id)) {
          handleUserLeave(socket, projectId);
        }
      });
    });
  });
};

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
