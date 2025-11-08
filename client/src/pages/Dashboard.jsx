import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Upload,
  FileJson,
  Globe,
  X,
  Download,
  User,
  Calendar,
  FileJson as FileJsonIcon,
  RefreshCcw,
  ChevronDown,
  FolderOpen,
  Share2,
  BarChart3,
  CheckSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { usePMStore } from "../store/pmStore";
import { projectsAPI, pmProjectsAPI } from "../utils/api";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [importedData, setImportedData] = useState(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communityProjects, setCommunityProjects] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    publicProjects: 0,
  });
  const { user, logout, isAuthenticated } = useAuthStore();
  const { fetchTeam, team } = usePMStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
    fetchTeam();
  }, []);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
      
      // Calculate user stats
      const total = data.projects.length;
      const publicCount = data.projects.filter(p => p.isPublic).length;
      setUserStats({
        totalProjects: total,
        publicProjects: publicCount,
      });
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
      const projectData = {
        name: newProjectName,
        description: "",
      };

      // If importing, add the imported data
      if (importMode && importedData) {
        projectData.elements = importedData.elements || [];
        projectData.canvasSettings = importedData.canvasSettings || {};
        projectData.description = importedData.description || "";
      }

      const { data } = await projectsAPI.create(projectData);
      toast.success(importMode ? "Project imported successfully!" : "Project created!");
      setShowCreateModal(false);
      setNewProjectName("");
      setImportMode(false);
      setImportedData(null);
      navigate(`/editor/${data.project._id}`);
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a valid .json project file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate the imported data structure
        if (!data.elements || !Array.isArray(data.elements)) {
          toast.error("Invalid project file format");
          return;
        }

        setImportedData(data);
        setNewProjectName(data.name || "Imported Project");
        setImportMode(true);
        toast.success("Project file loaded successfully!");
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Failed to parse project file");
      }
    };
    reader.readAsText(file);
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

  const loadCommunityProjects = async () => {
    setLoadingCommunity(true);
    try {
      const { data } = await projectsAPI.getPublic();
      setCommunityProjects(data.projects || []);
    } catch (error) {
      toast.error("Failed to load community projects");
    } finally {
      setLoadingCommunity(false);
    }
  };

  const handleOpenCommunity = () => {
    setShowCommunityModal(true);
    loadCommunityProjects();
  };

  const handleDownload = async (projectId, projectName) => {
    if (!isAuthenticated) {
      toast.error("Please login to download projects");
      navigate("/login", { state: { returnTo: "/dashboard" } });
      return;
    }

    setDownloadingId(projectId);
    try {
      const { data } = await projectsAPI.getOne(projectId);
      const project = data.project;

      const projectData = {
        name: project.name,
        description: project.description || "",
        elements: project.elements || [],
        canvasSettings: project.canvasSettings || {},
        version: "1.0",
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(projectData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, "_")}_project.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Project downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to download projects");
        navigate("/login", { state: { returnTo: "/dashboard" } });
      } else {
        toast.error("Failed to download project");
      }
    } finally {
      setDownloadingId(null);
    }
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
      <header className="relative z-[60] border-b border-white/10 bg-black/50 backdrop-blur-xl">
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
                onClick={() => navigate("/pm-dashboard")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 text-white rounded-full transition-all duration-300"
                title="Project Management Dashboard"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">PM Dashboard</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/teams")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 hover:from-cyan-600/30 hover:to-purple-600/30 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 text-white rounded-full transition-all duration-300"
                title="Teams"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Teams</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenCommunity}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 hover:from-cyan-600/30 hover:to-purple-600/30 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 text-white rounded-full transition-all duration-300"
                title="View Community Projects"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Community</span>
              </motion.button>
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
              
              {/* User Profile Dropdown */}
              <div className="relative user-menu-container">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-full transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-gray-300 font-medium">
                    {user?.username}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                    >
                      {/* User Info Section */}
                      <div className="p-4 border-b border-white/10 bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-lg font-bold">
                            {user?.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-base">{user?.username}</p>
                            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                          </div>
                        </div>
                        
                        {/* User Statistics */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                              <FolderOpen className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs text-gray-400">Projects</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{userStats.totalProjects}</p>
                          </div>
                          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                              <Share2 className="w-4 h-4 text-purple-400" />
                              <span className="text-xs text-gray-400">Public</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{userStats.publicProjects}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions Section */}
                      <div className="p-3">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">Logout</p>
                            <p className="text-xs text-gray-400">Sign out of your account</p>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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

        {/* PM Section */}
        {team && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <CardSpotlight className="bg-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Project Management
                    </h3>
                    <p className="text-sm text-gray-400">
                      {team.pmProjects && team.pmProjects.length > 0
                        ? "Manage your team's tasks and track progress"
                        : "Create a PM project to start managing tasks"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {team.pmProjects && team.pmProjects.length > 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const firstPMProject = team.pmProjects[0];
                        const pmProjectId = firstPMProject._id || firstPMProject;
                        navigate(`/pm-projects/${pmProjectId}`);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
                    >
                      View PM Project
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/teams")}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
                    >
                      Create PM Project
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/pm-dashboard")}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
                  >
                    Dashboard
                  </motion.button>
                </div>
              </div>
            </CardSpotlight>
          </motion.div>
        )}

        {!team && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <CardSpotlight className="bg-black/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      Start Project Management
                    </h3>
                    <p className="text-sm text-gray-400">
                      Create a team to collaborate on project management
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/teams")}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
                >
                  Create Team
                </motion.button>
              </div>
            </CardSpotlight>
          </motion.div>
        )}

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
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
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
                      {/* PM Project Link */}
                      <PMProjectLink designProjectId={project._id} />
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
          onClick={() => {
            setShowCreateModal(false);
            setImportMode(false);
            setImportedData(null);
            setNewProjectName("");
          }}
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
                  {importMode ? (
                    <Upload className="w-6 h-6 text-purple-400" />
                  ) : (
                    <Plus className="w-6 h-6 text-cyan-400" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {importMode ? "Import Project" : "Create New Project"}
                </h3>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                {/* Import/Create Toggle */}
                {!importMode && (
                  <div className="mb-4">
                    <label
                      htmlFor="file-import"
                      className="block w-full cursor-pointer"
                    >
                      <div className="p-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                            <FileJson className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">
                              Import existing project
                            </div>
                            <div className="text-gray-400 text-xs">
                              Upload a .json project file
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </label>
                    <input
                      id="file-import"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </div>
                )}

                {importMode && importedData && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <FileJson className="w-4 h-4" />
                      <span className="font-medium">Project file loaded</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {importedData.elements?.length || 0} elements •{" "}
                      {importedData.canvasSettings?.width || 1920}x
                      {importedData.canvasSettings?.height || 1080}
                    </div>
                  </div>
                )}

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
                    onClick={() => {
                      setShowCreateModal(false);
                      setImportMode(false);
                      setImportedData(null);
                      setNewProjectName("");
                    }}
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
                    {importMode ? "Import Project" : "Create Project"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Community Projects Modal */}
      {showCommunityModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCommunityModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-[90vh] bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 rounded-xl border border-cyan-500/30">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                    Community Projects
                  </h2>
                  <p className="text-sm text-gray-400">
                    Discover and download projects shared by the community
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCommunityModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loadingCommunity ? (
                <div className="flex items-center justify-center py-20">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <div
                      className="absolute inset-0 w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"
                      style={{
                        animationDirection: "reverse",
                        animationDuration: "1.5s",
                      }}
                    />
                  </div>
                </div>
              ) : communityProjects.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No public projects yet
                  </h3>
                  <p className="text-gray-500">
                    Be the first to share your project with the community!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communityProjects.map((project, index) => (
                    <motion.div
                      key={project._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10 h-full flex flex-col">
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                                {project.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 mb-4 flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <User className="w-4 h-4 text-cyan-400" />
                              <span className="text-white">
                                {project.owner?.username || "Unknown"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span>
                                {new Date(project.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDownload(project._id, project.name)}
                            disabled={downloadingId === project._id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 rounded-xl text-sm text-white transition-all duration-300 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {downloadingId === project._id ? (
                              <>
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <FileJsonIcon className="w-4 h-4" />
                                <span>Download JSON</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </CardSpotlight>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {communityProjects.length} project{communityProjects.length !== 1 ? "s" : ""} shared
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/community")}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl text-sm text-white transition-all duration-300"
              >
                <span>View Full Page</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// PM Project Link Component
const PMProjectLink = ({ designProjectId }) => {
  const [pmProject, setPMProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPMProject();
  }, [designProjectId]);

  const loadPMProject = async () => {
    try {
      setLoading(true);
      const { data } = await pmProjectsAPI.getByDesignProject(designProjectId);
      setPMProject(data.pmProject);
    } catch (error) {
      // PM project doesn't exist, that's okay
      setPMProject(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  if (pmProject) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/pm-projects/${pmProject._id}`);
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 text-white rounded-lg transition-all duration-300 text-sm font-medium"
      >
        <CheckSquare className="w-4 h-4" />
        View PM Project
      </motion.button>
    );
  }

  return null;
};

export default Dashboard;
