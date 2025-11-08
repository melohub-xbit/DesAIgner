import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useEditorStore } from "../store/editorStore";
import { projectsAPI } from "../utils/api";
import socketService from "../utils/socket";
import Toolbar from "../components/editor/Toolbar";
import Sidebar from "../components/editor/Sidebar";
import PropertiesPanel from "../components/editor/PropertiesPanel";
import PixiCanvas from "../components/editor/PixiCanvas";
import CollaboratorCursors from "../components/editor/CollaboratorCursors";
import AIAssistantPanel from "../components/editor/AssistantPanel";

const GRID_MINOR = 25;

const Editor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore((state) => ({
    user: state.user,
    token: state.token,
  }));
  const {
    elements,
    setElements,
    setCanvasSettings,
    setActiveUsers,
    updateUserCursor,
    removeUserCursor,
  } = useEditorStore();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const saveTimeoutRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadProject();
    setupSocketListeners();

    // Keyboard shortcuts - All require Ctrl+Alt
    const handleKeyDown = (e) => {
      // Check if Ctrl+Alt (or Cmd+Alt on Mac) is pressed
      const isModifierPressed = (e.ctrlKey || e.metaKey) && e.altKey;
      
      if (!isModifierPressed) {
        return; // Ignore if modifiers not pressed
      }

      const { setActiveTool, undo, redo, deleteSelected } =
        useEditorStore.getState();

      // Tool shortcuts (Ctrl+Alt+key)
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        setActiveTool("select");
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setActiveTool("pan");
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setActiveTool("rectangle");
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setActiveTool("circle");
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        setActiveTool("triangle");
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setActiveTool("line");
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setActiveTool("arrow");
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setActiveTool("text");
      }

      // Undo/Redo (Ctrl+Alt+Z / Ctrl+Alt+Shift+Z)
      if (e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
      } else if (e.key === "z") {
        e.preventDefault();
        undo();
      }

      // Delete (Ctrl+Alt+Delete / Ctrl+Alt+Backspace)
      if (e.key === "Delete" || e.key === "Backspace") {
        const { selectedIds } = useEditorStore.getState();
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      }

      // Arrow key nudging (Ctrl+Alt+Arrow)
      if (
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        const { selectedIds, elements, updateElement, canvasSettings } =
          useEditorStore.getState();
        if (selectedIds.length > 0) {
          e.preventDefault();
          const baseStep = e.shiftKey ? 10 : 1;
          const step = canvasSettings?.snapToGrid ? GRID_MINOR : baseStep;
          const dx =
            e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy =
            e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          selectedIds.forEach((id) => {
            const element = elements.find((el) => el.id === id);
            if (element && !element.locked) {
              const targetX = element.x + dx;
              const targetY = element.y + dy;
              updateElement(id, {
                x: canvasSettings?.snapToGrid
                  ? Math.round(targetX / GRID_MINOR) * GRID_MINOR
                  : targetX,
                y: canvasSettings?.snapToGrid
                  ? Math.round(targetY / GRID_MINOR) * GRID_MINOR
                  : targetY,
              });
            }
          });
        }
      }

      // Escape to deselect (Ctrl+Alt+Escape)
      if (e.key === "Escape") {
        e.preventDefault();
        useEditorStore.getState().clearSelection();
        setActiveTool("select");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      setActiveUsers([]);
      socketService.leaveProject(projectId);
      socketService.disconnect();
    };
  }, [projectId, token]);

  useEffect(() => {
    // Auto-save on element changes
    if (project && elements.length >= 0) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProject();
      }, 2000); // Save after 2 seconds of inactivity
    }
  }, [elements]);

  const loadProject = async () => {
    try {
      const { data } = await projectsAPI.getOne(projectId);
      setProject(data.project);
      setElements(data.project.elements || []);
      setCanvasSettings(data.project.canvasSettings || {});

      // Connect to socket
      if (token) {
        socketService.connect(token);
        socketService.joinProject(projectId, token);
      }

      setLoading(false);
    } catch (error) {
      toast.error("Failed to load project");
      navigate("/dashboard");
    }
  };

  const setupSocketListeners = () => {
    if (!token) return;

    const socket = socketService.connect(token);

    socket.on("active-users", (users) => {
      setActiveUsers(users);
    });

    socket.on("user-joined", ({ socketId, user }) => {
      toast.success(`${user.username} joined`);
    });

    socket.on("user-left", ({ socketId, user }) => {
      removeUserCursor(socketId);
      if (user) {
        toast(`${user.username} left`, { icon: "👋" });
      }
    });

    socket.on("element-added", ({ element }) => {
      useEditorStore.getState().addElement(element);
    });

    socket.on("element-updated", ({ element }) => {
      useEditorStore.getState().updateElement(element.id, element);
    });

    socket.on("element-deleted", ({ elementId }) => {
      useEditorStore.getState().deleteElement(elementId);
    });

    socket.on("elements-updated", ({ elements }) => {
      setElements(elements);
    });

    socket.on("cursor-moved", ({ socketId, user, position }) => {
      updateUserCursor(socketId, user, position);
    });

    socket.on("canvas-updated", ({ settings }) => {
      setCanvasSettings(settings);
    });
  };

  const saveProject = async () => {
    try {
      await projectsAPI.update(projectId, {
        elements,
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-pink-950/20 pointer-events-none" />
        
        <div className="text-center relative z-10">
          <div className="relative inline-block mb-8">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-xl font-semibold animate-pulse">
            Loading your canvas...
          </p>
        </div>
      </div>
    );
  }

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-pink-950/20 pointer-events-none" />
      
      <Toolbar
        project={project}
        projectId={projectId}
        onProjectUpdate={handleProjectUpdate}
        onAIRequest={() => setAssistantOpen(true)}
        onExportImage={() => {
          if (canvasRef.current?.exportCanvas) {
            canvasRef.current
              .exportCanvas("png", 1.0)
              .then(() => {
                toast.success("Canvas exported successfully!");
              })
              .catch((error) => {
                console.error("Export failed:", error);
                toast.error("Failed to export canvas");
              });
          }
        }}
        onExportProject={() => {
          try {
            const projectData = {
              name: project.name,
              description: project.description || "",
              elements: elements,
              canvasSettings: useEditorStore.getState().canvasSettings,
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
            
            toast.success("Project exported successfully!");
          } catch (error) {
            console.error("Export project failed:", error);
            toast.error("Failed to export project");
          }
        }}
      />

      <div className="flex-1 relative overflow-hidden">
        {/* Canvas - Full width background */}
        <div className="absolute inset-0">
          <PixiCanvas ref={canvasRef} projectId={projectId} />
          <CollaboratorCursors />
        </div>

        {/* Left Sidebar - Overlays canvas */}
        <div className="absolute left-0 top-0 bottom-0 z-10">
          <Sidebar projectId={projectId} />
        </div>

        {/* Right Properties Panel - Overlays canvas */}
        <div className="absolute right-0 top-0 bottom-0 z-10">
          <PropertiesPanel projectId={projectId} />
        </div>

        <AIAssistantPanel
          isOpen={isAssistantOpen}
          onClose={() => setAssistantOpen(false)}
          projectId={projectId}
        />
      </div>
    </div>
  );
};

export default Editor;
