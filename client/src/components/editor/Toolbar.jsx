import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { projectsAPI } from "../../utils/api";
import toast from "react-hot-toast";

const Toolbar = ({ project, projectId, onProjectUpdate }) => {
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
    { id: "select", icon: MousePointer2, label: "Select (V)" },
    { id: "pan", icon: Hand, label: "Pan (H)" },
    { id: "rectangle", icon: Square, label: "Rectangle (R)" },
    { id: "circle", icon: Circle, label: "Circle (C)" },
    { id: "triangle", icon: Triangle, label: "Triangle (Y)" },
    { id: "line", icon: Slash, label: "Line (L)" },
    { id: "arrow", icon: ArrowUpRight, label: "Arrow (A)" },
    { id: "freehand", icon: Pen, label: "Freehand (P)" },
    { id: "text", icon: Type, label: "Text (T)" },
  ];

  const handleExport = () => {
    toast.success("Export feature coming soon!");
  };

  const handleAI = () => {
    toast.success("AI suggestions coming soon!");
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
    <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-gray-700" />

        {isRenaming ? (
          <div className="flex items-center gap-2">
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
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-medium focus:outline-none focus:border-blue-500"
              autoFocus
              disabled={isSaving}
            />
            <button
              onClick={handleSaveRename}
              disabled={isSaving}
              className="p-1 hover:bg-gray-700 rounded text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelRename}
              disabled={isSaving}
              className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-white font-medium">{project?.name}</h2>
            <button
              onClick={handleStartRename}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Rename project"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="w-px h-8 bg-gray-700" />

        {/* Fill Toggle */}
        <button
          onClick={() => setIsFilled(!isFilled)}
          className={`p-2 rounded-lg transition-colors ${
            isFilled
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }`}
          title={isFilled ? "Filled Shapes" : "Unfilled Shapes"}
        >
          <SquareStack className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-gray-700" />

        {/* Tools */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-2 rounded-lg transition-colors ${
                  activeTool === tool.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                title={tool.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Center section */}
      <div className="flex items-center gap-2">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 disabled:opacity-30"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-gray-700 mx-2" />

        <button
          onClick={() => setZoom(zoom - 0.1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <span className="text-gray-300 text-sm min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(zoom + 0.1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`/projects/${projectId}/settings`)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-200"
          title="Project settings"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>

        <button
          onClick={handleExport}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
          title="Export"
        >
          <Download className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
          <Users className="w-4 h-4 text-gray-300" />
          <span className="text-sm text-gray-300">
            {Math.max(activeUsers.length, 1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
