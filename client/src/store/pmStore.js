import { create } from "zustand";
import { teamsAPI, pmProjectsAPI, tasksAPI } from "../utils/api";
import socketService from "../utils/socket";

export const usePMStore = create((set, get) => ({
  // State
  team: null,
  pmProject: null,
  tasks: [],
  loading: false,
  activePMUsers: [],

  // Actions
  setTeam: (team) => set({ team }),
  setPMProject: (pmProject) => set({ pmProject }),
  setTasks: (tasks) => set({ tasks }),
  setLoading: (loading) => set({ loading }),
  setActivePMUsers: (users) => set({ activePMUsers: users }),

  // Fetch team (gets first team for now, can be extended to support team selection)
  fetchTeam: async () => {
    try {
      set({ loading: true });
      const { data } = await teamsAPI.getMyTeam();
      // Handle both old format (team) and new format (teams array)
      const team = data.teams && data.teams.length > 0 ? data.teams[0] : (data.team || null);
      set({ team, loading: false });
      return team;
    } catch (error) {
      console.error("Fetch team error:", error);
      set({ loading: false });
      return null;
    }
  },

  // Create team
  createTeam: async (teamData) => {
    try {
      set({ loading: true });
      const { data } = await teamsAPI.create(teamData);
      set({ team: data.team, loading: false });
      return data.team;
    } catch (error) {
      console.error("Create team error:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Update team
  updateTeam: async (teamId, teamData) => {
    try {
      const { data } = await teamsAPI.update(teamId, teamData);
      set({ team: data.team });
      return data.team;
    } catch (error) {
      console.error("Update team error:", error);
      throw error;
    }
  },

  // Invite member
  inviteMember: async (teamId, email, role) => {
    try {
      const { data } = await teamsAPI.inviteMember(teamId, { email, role });
      set({ team: data.team });
      return data.team;
    } catch (error) {
      console.error("Invite member error:", error);
      throw error;
    }
  },

  // Remove member
  removeMember: async (teamId, memberId) => {
    try {
      const { data } = await teamsAPI.removeMember(teamId, memberId);
      set({ team: data.team });
      return data.team;
    } catch (error) {
      console.error("Remove member error:", error);
      throw error;
    }
  },

  // Create PM project
  createPMProject: async (teamId, designProjectId) => {
    try {
      set({ loading: true });
      const { data } = await teamsAPI.createPMProject(teamId, {
        designProjectId,
      });
      set({ pmProject: data.pmProject, loading: false });
      // Update team with PM project reference
      if (get().team) {
        const currentTeam = get().team;
        const pmProjects = currentTeam.pmProjects || [];
        if (!pmProjects.some((p) => p._id === data.pmProject._id || p === data.pmProject._id)) {
          set({ team: { ...currentTeam, pmProjects: [...pmProjects, data.pmProject._id] } });
        }
      }
      return data.pmProject;
    } catch (error) {
      console.error("Create PM project error:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Fetch PM project
  fetchPMProject: async (pmProjectId) => {
    try {
      set({ loading: true });
      const { data } = await pmProjectsAPI.getOne(pmProjectId);
      set({ pmProject: data.pmProject, loading: false });
      return data.pmProject;
    } catch (error) {
      console.error("Fetch PM project error:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Fetch PM project by design project
  fetchPMProjectByDesign: async (designProjectId) => {
    try {
      const { data } = await pmProjectsAPI.getByDesignProject(designProjectId);
      set({ pmProject: data.pmProject });
      return data.pmProject;
    } catch (error) {
      console.error("Fetch PM project by design error:", error);
      return null;
    }
  },

  // Update PM project
  updatePMProject: async (pmProjectId, pmProjectData) => {
    try {
      const { data } = await pmProjectsAPI.update(pmProjectId, pmProjectData);
      set({ pmProject: data.pmProject });
      return data.pmProject;
    } catch (error) {
      console.error("Update PM project error:", error);
      throw error;
    }
  },

  // Fetch tasks
  fetchTasks: async (pmProjectId) => {
    try {
      set({ loading: true });
      const { data } = await tasksAPI.getByPMProject(pmProjectId);
      set({ tasks: data.tasks, loading: false });
      return data.tasks;
    } catch (error) {
      console.error("Fetch tasks error:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Create task
  createTask: async (taskData) => {
    try {
      const { data } = await tasksAPI.create(taskData);
      const newTasks = [...get().tasks, data.task];
      set({ tasks: newTasks });
      return data.task;
    } catch (error) {
      console.error("Create task error:", error);
      throw error;
    }
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    try {
      const { data } = await tasksAPI.update(taskId, taskData);
      const updatedTasks = get().tasks.map((t) =>
        t._id === taskId ? data.task : t
      );
      set({ tasks: updatedTasks });
      return data.task;
    } catch (error) {
      console.error("Update task error:", error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      const filteredTasks = get().tasks.filter((t) => t._id !== taskId);
      set({ tasks: filteredTasks });
    } catch (error) {
      console.error("Delete task error:", error);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    try {
      const { data } = await tasksAPI.updateStatus(taskId, { status });
      const updatedTasks = get().tasks.map((t) =>
        t._id === taskId ? data.task : t
      );
      set({ tasks: updatedTasks });
      // Update PM project progress if needed
      if (get().pmProject) {
        const { data: pmData } = await pmProjectsAPI.getOne(
          get().pmProject._id
        );
        set({ pmProject: pmData.pmProject });
      }
      return data.task;
    } catch (error) {
      console.error("Update task status error:", error);
      throw error;
    }
  },

  // Update task assignee
  updateTaskAssignee: async (taskId, assigneeId) => {
    try {
      const { data } = await tasksAPI.updateAssignee(taskId, {
        assigneeId,
      });
      const updatedTasks = get().tasks.map((t) =>
        t._id === taskId ? data.task : t
      );
      set({ tasks: updatedTasks });
      return data.task;
    } catch (error) {
      console.error("Update task assignee error:", error);
      throw error;
    }
  },

  // Socket methods for PM collaboration
  joinPMProject: (pmProjectId, token) => {
    if (socketService.socket) {
      socketService.socket.emit("join-pm-project", { pmProjectId, token });
    }
  },

  leavePMProject: (pmProjectId) => {
    if (socketService.socket) {
      socketService.socket.emit("leave-pm-project", { pmProjectId });
    }
  },

  // Setup socket listeners for PM
  setupPMSocketListeners: () => {
    const socket = socketService.socket;
    if (!socket) return;

    socket.on("pm-active-users", (users) => {
      set({ activePMUsers: users });
    });

    socket.on("pm-user-joined", ({ user }) => {
      console.log("PM user joined:", user);
    });

    socket.on("pm-user-left", ({ user }) => {
      console.log("PM user left:", user);
    });

    socket.on("task-created", ({ task }) => {
      const currentTasks = get().tasks;
      if (!currentTasks.find((t) => t._id === task._id)) {
        set({ tasks: [...currentTasks, task] });
      }
    });

    socket.on("task-updated", ({ task }) => {
      const updatedTasks = get().tasks.map((t) =>
        t._id === task._id ? task : t
      );
      set({ tasks: updatedTasks });
    });

    socket.on("task-deleted", ({ taskId }) => {
      const filteredTasks = get().tasks.filter((t) => t._id !== taskId);
      set({ tasks: filteredTasks });
    });

    socket.on("task-status-changed", ({ taskId, status }) => {
      const updatedTasks = get().tasks.map((t) =>
        t._id === taskId ? { ...t, status } : t
      );
      set({ tasks: updatedTasks });
    });

    socket.on("pm-project-updated", ({ pmProject }) => {
      set({ pmProject });
    });
  },

  // Cleanup socket listeners
  cleanupPMSocketListeners: () => {
    const socket = socketService.socket;
    if (!socket) return;

    socket.off("pm-active-users");
    socket.off("pm-user-joined");
    socket.off("pm-user-left");
    socket.off("task-created");
    socket.off("task-updated");
    socket.off("task-deleted");
    socket.off("task-status-changed");
    socket.off("pm-project-updated");
  },

  // Reset store
  reset: () => {
    set({
      team: null,
      pmProject: null,
      tasks: [],
      loading: false,
      activePMUsers: [],
    });
  },
}));

