import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  MousePointer2,
  Hand,
  Square,
  Circle,
  Triangle,
  Slash,
  ArrowUpRight,
  Type,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Sparkles,
  Pen,
  SquareStack,
  Edit2,
  Check,
  X,
  Settings,
  Palette,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { projectsAPI } from "../../utils/api";
import toast from "react-hot-toast";

const Toolbar = ({ project, projectId, onProjectUpdate, onAIRequest, onExport }) => {
  const navigate = useNavigate();
  const [isRenaming, setIsRenaming] = useState(false);
  const [projectName, setProjectName] = useState(project?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    undo,
    redo,
    history,
    historyIndex,
    activeUsers,
    isFilled,
    setIsFilled,
  } = useEditorStore();

  useEffect(() => {
    if (project?.name) {
      setProjectName(project.name);
    }
  }, [project?.name]);

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select (Ctrl+Alt+V)" },
    { id: "pan", icon: Hand, label: "Pan (Ctrl+Alt+H)" },
    { id: "rectangle", icon: Square, label: "Rectangle (Ctrl+Alt+R)" },
    { id: "circle", icon: Circle, label: "Circle (Ctrl+Alt+C)" },
    { id: "triangle", icon: Triangle, label: "Triangle (Ctrl+Alt+Y)" },
    { id: "line", icon: Slash, label: "Line (Ctrl+Alt+L)" },
    { id: "arrow", icon: ArrowUpRight, label: "Arrow (Ctrl+Alt+A)" },
    { id: "freehand", icon: Pen, label: "Freehand (P)" },
    { id: "text", icon: Type, label: "Text (Ctrl+Alt+T)" },
  ];

  const handleExport = () => {
    if (typeof onExport === "function") {
      onExport();
    } else {
      toast.error("Export function not available");
    }
  };

  const handleAI = () => {
    if (typeof onAIRequest === "function") {
      onAIRequest();
    } else {
      toast.success("AI suggestions coming soon!");
    }
  };

  const handleStartRename = () => {
    setIsRenaming(true);
    setProjectName(project?.name || "");
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setProjectName(project?.name || "");
  };

  const handleSaveRename = async () => {
    if (!projectName.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }

    if (projectName.trim() === project?.name) {
      setIsRenaming(false);
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await projectsAPI.update(projectId, {
        name: projectName.trim(),
      });
      toast.success("Project renamed successfully");
      setIsRenaming(false);
      if (onProjectUpdate) {
        onProjectUpdate(data.project);
      }
    } catch (error) {
      toast.error("Failed to rename project");
      setProjectName(project?.name || "");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl z-20">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/10 via-purple-950/5 to-pink-950/10 pointer-events-none" />
      
      <div className="relative h-full flex items-center justify-between px-4 gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 text-gray-300 hover:text-white group"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </motion.button>

          <div className="w-px h-8 bg-white/10" />

          {/* Logo and Project Name */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-50" />
              <Palette className="relative w-6 h-6 text-cyan-400" />
            </div>
            
            {isRenaming ? (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveRename();
                    } else if (e.key === "Escape") {
                      handleCancelRename();
                    }
                  }}
                  className="px-3 py-1.5 bg-white/5 border border-white/20 focus:border-cyan-500/50 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 backdrop-blur-sm"
                  autoFocus
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveRename}
                  disabled={isSaving}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelRename}
                  disabled={isSaving}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-white font-semibold text-sm sm:text-base truncate max-w-[200px]">{project?.name}</h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleStartRename}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Rename project"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-white/10 hidden md:block" />

          {/* Fill Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFilled(!isFilled)}
            className={`hidden md:flex p-2.5 rounded-xl transition-all duration-300 ${
              isFilled
                ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
            title={isFilled ? "Filled Shapes" : "Unfilled Shapes"}
          >
            <SquareStack className="w-5 h-5" />
          </motion.button>

          <div className="w-px h-8 bg-white/10 hidden lg:block" />

          {/* Tools */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <motion.button
                  key={tool.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTool(tool.id)}
                  className={`relative p-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                  title={tool.label}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeToolBg"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Center section */}
        <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo (Ctrl+Alt+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo (Ctrl+Alt+Shift+Z)"
          >
            <Redo2 className="w-5 h-5" />
          </motion.button>

          <div className="w-px h-6 bg-white/20 mx-1" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(zoom - 0.1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </motion.button>

          <div className="min-w-[70px] text-center px-3 py-1.5 bg-white/5 rounded-lg">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-sm font-semibold">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(zoom + 0.1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/projects/${projectId}/settings`)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-gray-200"
            title="Project settings"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm hidden md:inline">Settings</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAI}
            className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl transition-all duration-300 text-white font-medium shadow-lg shadow-purple-500/30"
            title="AI Suggestions"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
            <Sparkles className="w-4 h-4 relative" />
            <span className="text-sm relative hidden sm:inline">AI</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300 text-gray-300 hover:text-white"
            title="Export"
          >
            <Download className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
            <div className="relative">
              <Users className="w-4 h-4 text-cyan-400" />
              {Math.max(activeUsers.length, 1) > 1 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {Math.max(activeUsers.length, 1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
