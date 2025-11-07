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

const GRID_MINOR = 25;

const Editor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadProject();
    setupSocketListeners();

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      const { setActiveTool, undo, redo, deleteSelected } = useEditorStore.getState();
      
      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('rectangle');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('circle');
      } else if (e.key === 'y' || e.key === 'Y') {
        setActiveTool('triangle');
      } else if (e.key === 'l' || e.key === 'L') {
        setActiveTool('line');
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTool('arrow');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('text');
      }
      
      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key === 'z') {
          e.preventDefault();
          redo();
        } else if (e.key === 'z') {
          e.preventDefault();
          undo();
        }
      }
      
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedIds } = useEditorStore.getState();
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      }
      
      // Arrow key nudging
      if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        const { selectedIds, elements, updateElement, canvasSettings } = useEditorStore.getState();
        if (selectedIds.length > 0) {
          e.preventDefault();
          const baseStep = e.shiftKey ? 10 : 1;
          const step = canvasSettings?.snapToGrid ? GRID_MINOR : baseStep;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
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

      // Escape to deselect
      if (e.key === 'Escape') {
        useEditorStore.getState().clearSelection();
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      socketService.leaveProject(projectId);
      socketService.disconnect();
    };
  }, [projectId]);

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
      socketService.connect();
      socketService.joinProject(projectId, user);

      setLoading(false);
    } catch (error) {
      toast.error("Failed to load project");
      navigate("/dashboard");
    }
  };

  const setupSocketListeners = () => {
    const socket = socketService.connect();

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
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <Toolbar project={project} projectId={projectId} onProjectUpdate={handleProjectUpdate} />

      <div className="flex-1 relative overflow-hidden">
        {/* Canvas - Full width background */}
        <div className="absolute inset-0">
          <PixiCanvas projectId={projectId} />
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
      </div>
    </div>
  );
};

export default Editor;
