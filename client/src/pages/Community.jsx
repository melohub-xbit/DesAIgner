import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  User,
  Calendar,
  RefreshCcw,
  ArrowLeft,
  Users,
  FileJson,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { projectsAPI } from "../utils/api";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";

const Community = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const handleGoBack = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/home");
    }
  };

  const loadProjects = async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await projectsAPI.getPublic();
      setProjects(data.projects || []);
    } catch (error) {
      toast.error("Failed to load community projects");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleDownload = async (projectId, projectName) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error("Please login to download projects");
      navigate("/login", { state: { returnTo: "/community" }, replace: true });
      return;
    }

    setDownloadingId(projectId);
    try {
      // Fetch the full project data
      const { data } = await projectsAPI.getOne(projectId);
      const project = data.project;

      // Create JSON export (same logic as Editor.jsx)
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
        navigate("/login", { state: { returnTo: "/community" }, replace: true });
      } else {
        toast.error("Failed to download project");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
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
          <p className="text-gray-400 mt-4">Loading community projects...</p>
        </div>
      </div>
    );
  }

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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoBack}
                className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-gray-200"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                  Community Projects
                </h1>
                <p className="text-gray-400 mt-1">
                  Discover and download projects shared by the community
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => loadProjects({ silent: true })}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl text-gray-200 transition-all duration-300"
                title="Refresh projects"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Refresh</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-2">
              No public projects yet
            </h2>
            <p className="text-gray-500">
              Be the first to share your project with the community!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10 h-full flex flex-col">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 mb-4 flex-1">
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

                      {project.collaborators?.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users className="w-4 h-4 text-pink-400" />
                          <span>
                            {project.collaborators.length} collaborator
                            {project.collaborators.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDownload(project._id, project.name)}
                      disabled={downloadingId === project._id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 rounded-xl text-sm text-white transition-all duration-300 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {downloadingId === project._id ? (
                        <>
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <FileJson className="w-4 h-4" />
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
      </main>
    </div>
  );
};

export default Community;

