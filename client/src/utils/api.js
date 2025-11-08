import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// API methods
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const projectsAPI = {
  getAll: () => api.get("/projects"),
  getOne: (id) => api.get(`/projects/${id}`),
  getPublic: () => api.get("/projects/public"),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  togglePublic: (id) => api.patch(`/projects/${id}/public`),
  addCollaborator: (id, data) =>
    api.post(`/projects/${id}/collaborators`, data),
  updateCollaboratorRole: (id, collaboratorId, data) =>
    api.patch(`/projects/${id}/collaborators/${collaboratorId}`, data),
  removeCollaborator: (id, collaboratorId) =>
    api.delete(`/projects/${id}/collaborators/${collaboratorId}`),
  generateInviteCode: (id) => api.post(`/projects/${id}/invite-code`),
  joinWithCode: (code) => api.post(`/projects/join-with-code`, { code }),
};

export const assetsAPI = {
  getAll: (projectId) => api.get("/assets", { params: { projectId } }),
  upload: (formData) =>
    api.post("/assets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/assets/${id}`),
  update: (id, data) => api.patch(`/assets/${id}`, data),
};

export const aiAPI = {
  createDesign: (data) => api.post("/ai/create-design", data),
};

export const teamsAPI = {
  getMyTeam: () => api.get("/teams"),
  create: (data) => api.post("/teams", data),
  getOne: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  inviteMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/teams/${id}/members/${memberId}`),
  createPMProject: (id, data) => api.post(`/teams/${id}/pm-project`, data),
};

export const pmProjectsAPI = {
  getAll: () => api.get("/pm-projects"),
  getOne: (id) => api.get(`/pm-projects/${id}`),
  update: (id, data) => api.put(`/pm-projects/${id}`, data),
  getByDesignProject: (designProjectId) =>
    api.get(`/pm-projects/design/${designProjectId}`),
};

export const tasksAPI = {
  getByPMProject: (pmProjectId) =>
    api.get(`/tasks/pm-project/${pmProjectId}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  updateAssignee: (id, data) => api.patch(`/tasks/${id}/assignee`, data),
};