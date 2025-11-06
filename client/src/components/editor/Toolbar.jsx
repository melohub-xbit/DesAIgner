import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Users,
  MousePointer2,
  Square,
  Circle,
  Type,
  Image,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Sparkles,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import toast from "react-hot-toast";

const Toolbar = ({ project, projectId }) => {
  const navigate = useNavigate();
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
  } = useEditorStore();

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select (V)" },
    { id: "rectangle", icon: Square, label: "Rectangle (R)" },
    { id: "circle", icon: Circle, label: "Circle (C)" },
    { id: "text", icon: Type, label: "Text (T)" },
  ];

  const handleExport = () => {
    toast.success("Export feature coming soon!");
  };

  const handleAI = () => {
    toast.success("AI suggestions coming soon!");
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

        <h2 className="text-white font-medium">{project?.name}</h2>

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
          onClick={handleAI}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
          title="AI Suggestions"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">AI</span>
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
            {activeUsers.length + 1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
