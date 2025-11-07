import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, LogOut, Palette, Folder, Clock, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { projectsAPI } from "../utils/api";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const { data } = await projectsAPI.create({
        name: newProjectName,
        description: "",
      });
      toast.success("Project created!");
      setShowCreateModal(false);
      setNewProjectName("");
      navigate(`/editor/${data.project._id}`);
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleJoinProject = async (event) => {
    event.preventDefault();
    const sanitizedCode = joinCode.trim().toUpperCase();
    if (!sanitizedCode) {
      toast.error("Enter an invite code to join");
      return;
    }

    setIsJoining(true);
    try {
      const { data } = await projectsAPI.joinWithCode(sanitizedCode);
      toast.success("Joined project successfully");
      setJoinCode("");
      await loadProjects();
      navigate(`/editor/${data.projectId}`);
    } catch (error) {
      const message = error.response?.data?.error || "Unable to join project";
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Palette className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-white">DesAIgner</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Your Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        <form
          onSubmit={handleJoinProject}
          className="mb-10 bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 max-w-xl"
        >
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
            Join with invite code
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.toUpperCase())
              }
              placeholder="Enter 6-character code"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest"
              maxLength={8}
              disabled={isJoining}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-60"
              disabled={isJoining}
            >
              <Users className="w-4 h-4" />
              {isJoining ? "Joining..." : "Join"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Ask the project owner for an invite code from the settings page.
          </p>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first project to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/editor/${project._id}`)}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Palette className="w-16 h-16 text-white opacity-50" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(project.updatedAt)}
                    </div>
                    {project.collaborators?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {project.collaborators.length}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject}>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                autoFocus
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
