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

    return () => {
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

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <Toolbar project={project} projectId={projectId} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar projectId={projectId} />

        <div className="flex-1 relative">
          <PixiCanvas projectId={projectId} />
          <CollaboratorCursors />
        </div>

        <PropertiesPanel />
      </div>
    </div>
  );
};

export default Editor;
