import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: token ? { token } : undefined,
        withCredentials: true,
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    } else if (token) {
      this.socket.auth = { token };
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(projectId, token) {
    if (this.socket) {
      this.socket.emit("join-project", { projectId, token });
    }
  }

  leaveProject(projectId) {
    if (this.socket) {
      this.socket.emit("leave-project", { projectId });
    }
  }

  emitElementAdd(projectId, element) {
    if (this.socket) {
      this.socket.emit("element-add", { projectId, element });
    }
  }

  emitElementUpdate(projectId, element) {
    if (this.socket) {
      this.socket.emit("element-update", { projectId, element });
    }
  }

  emitElementDelete(projectId, elementId) {
    if (this.socket) {
      this.socket.emit("element-delete", { projectId, elementId });
    }
  }

  emitElementsUpdate(projectId, elements) {
    if (this.socket) {
      this.socket.emit("elements-update", { projectId, elements });
    }
  }

  emitCursorMove(projectId, position) {
    if (this.socket) {
      this.socket.emit("cursor-move", { projectId, position });
    }
  }

  emitSelectionChange(projectId, selectedIds) {
    if (this.socket) {
      this.socket.emit("selection-change", { projectId, selectedIds });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
