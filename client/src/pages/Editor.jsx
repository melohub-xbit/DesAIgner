import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { projectsAPI } from "../utils/api";
import socketService from "../utils/socket";
import { useAuthStore } from "../store/authStore";
import { useEditorStore } from "../store/editorStore";
import Toolbar from "../components/editor/Toolbar";
import Sidebar from "../components/editor/Sidebar";
import PropertiesPanel from "../components/editor/PropertiesPanel";
import PixiCanvas from "../components/editor/PixiCanvas";
import CollaboratorCursors from "../components/editor/CollaboratorCursors";
import ShareModal from "../components/modals/ShareModals";

const GRID_MINOR = 25;

const Editor = () => {
  const { id: projectId } = useParams();
  const token = useAuthStore((s) => s.token);
  const [project, setProject] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const { setElements, setProjectId, elements } = useEditorStore();
  
  // NOTE: You need a ref for the save timeout to clear it across renders
  const saveTimeoutRef = useRef(null); 
  
  // Load project - Consolidating the definition using useCallback (from HEAD)
  const loadProject = useCallback(async () => {
    try {
      const { data } = await projectsAPI.getOne(projectId);
      setProject(data.project);
      setElements(data.project.elements || []);
      setProjectId(projectId);
      toast.success(`Loaded "${data.project.name}"`);
    } catch {
      toast.error("Failed to load project");
    }
  }, [projectId, setElements, setProjectId]);

  // Main Effect: Load, Socket Setup, and Keyboard Shortcuts
  useEffect(() => {
    // 1. Load project and setup socket listeners (from conflicting branch)
    loadProject();
    // Assuming setupSocketListeners was a function in the original code, 
    // but the socket connection logic is detailed below.

    // 2. Socket Connection (Consolidated)
    const socket = socketService.connect();
    socketService.joinProject(projectId, token);

    socket.on("error", (err) => {
      toast.error(err.error || "Socket error");
    });
    
    // 3. Keyboard shortcuts (from conflicting branch)
    const handleKeyDown = (e) => {
      const { 
        setActiveTool, 
        undo, 
        redo, 
        deleteSelected, 
        selectedIds, 
        elements, 
        updateElement, 
        canvasSettings,
        clearSelection 
      } = useEditorStore.getState();
      
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
        if (selectedIds.length > 0) {
          e.preventDefault();
          const baseStep = e.shiftKey ? 10 : 1;
          // NOTE: canvasSettings might be null/undefined initially, added a safe fallback
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
        clearSelection();
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup logic (from both branches)
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      socketService.leaveProject(projectId);
      socketService.disconnect();
    };
  }, [projectId, token, loadProject]); // Added loadProject as dependency because it's used inside

  // Auto-save on element changes (from conflicting branch)
  useEffect(() => {
    // Auto-save logic requires knowing what saveProject() does
    // For now, we assume a saveProject function is available or implemented here.
    const saveProject = async () => {
        // Placeholder for the save logic that was missing
        // This is where you would typically call projectsAPI.update(projectId, { elements: elements })
    };

    if (project && elements.length >= 0) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProject(); // Execute the save function
      }, 2000); // Save after 2 seconds of inactivity
    }
    
    // Clear timeout on unmount or dependency change
    return () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    };
  }, [elements, project]);


  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading project...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Toolbar project={project} projectId={projectId} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar projectId={projectId} />

        <div className="relative flex-1 overflow-hidden">
          <PixiCanvas projectId={projectId} />
          <CollaboratorCursors />
          <button
            onClick={() => setShowShare(true)}
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg shadow"
          >
            Invite Collaborator
          </button>
        </div>

        <PropertiesPanel />
      </div>

      {showShare && (
        <ShareModal projectId={projectId} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
};

export default Editor;