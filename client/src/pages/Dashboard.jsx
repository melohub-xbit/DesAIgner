import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  LogOut,
  Palette,
  Folder,
  Clock,
  Users,
  Sparkles,
  Zap,
  Grid3x3,
  ArrowRight,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { projectsAPI } from "../utils/api";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";

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
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Spotlight Effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-pink-950/20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-75 animate-pulse" />
                <Palette className="relative w-10 h-10 text-cyan-400" />
              </div>
              <h1 className="text-3xl py-5 font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                des-ai-gner
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/about")}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-full transition-all duration-300"
                title="About Us"
              >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">About Us</span>
              </motion.button>
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-gray-300 font-medium">
                  {user?.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-full transition-all duration-300"
              >
                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl py-5 md:text-4xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-cyan-200 mb-3">
                your canvas
              </h2>
              <p className="text-lg text-gray-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Where creativity meets collaboration
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-3"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-300" />
              <Plus className="relative w-6 h-6" />
              <span className="relative">New Project</span>
              <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {/* Join with Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardSpotlight className="max-w-2xl bg-black/40">
              <form onSubmit={handleJoinProject} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg border border-cyan-500/30">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Join a Project
                  </h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Got an invite code? Enter it below to join a collaborative
                  workspace
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(event) =>
                        setJoinCode(event.target.value.toUpperCase())
                      }
                      placeholder="ENTER-CODE"
                      className="w-full px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-lg tracking-widest font-mono transition-all"
                      maxLength={8}
                      disabled={isJoining}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-purple-500/5 to-cyan-500/0 rounded-xl pointer-events-none" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Join Now
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </CardSpotlight>
          </motion.div>
        </motion.div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <div
                className="absolute inset-0 w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              />
            </div>
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <Folder className="relative w-24 h-24 text-gray-600" />
            </div>
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 mb-3">
              Your canvas awaits
            </h3>
            <p className="text-gray-500 mb-8 text-lg max-w-md mx-auto">
              Start your creative journey by creating your first project
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
            >
              <Plus className="w-6 h-6" />
              Create Your First Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-6"
            >
              <Grid3x3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-2xl font-semibold text-white">
                All Projects
                <span className="ml-3 text-sm text-gray-500 font-normal">
                  ({projects.length})
                </span>
              </h3>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  onClick={() => navigate(`/editor/${project._id}`)}
                  className="group relative cursor-pointer"
                >
                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500" />

                  {/* Card */}
                  <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 group-hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-cyan-950/50 via-purple-950/50 to-pink-950/50 flex items-center justify-center relative overflow-hidden">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 blur-2xl opacity-30" />
                          <Palette className="relative w-16 h-16 text-white/30 group-hover:text-white/50 transition-colors" />
                        </div>
                      )}
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300 truncate">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-cyan-400/70" />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                        {project.collaborators?.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-purple-400/70" />
                            <span>{project.collaborators.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Indicator */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-full">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-xl opacity-75" />

            {/* Modal Content */}
            <div className="relative bg-black border border-white/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30">
                  <Plus className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Create New Project
                </h3>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome Design"
                    autoFocus
                    className="w-full px-5 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
                  >
                    Create Project
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
