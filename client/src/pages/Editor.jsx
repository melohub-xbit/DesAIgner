import { useEffect, useState, useCallback } from "react";
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

const Editor = () => {
  const { id: projectId } = useParams();
  const token = useAuthStore((s) => s.token);
  const [project, setProject] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const { setElements, setProjectId } = useEditorStore();

  // Load project
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

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Socket connection
  useEffect(() => {
    const socket = socketService.connect();
    socketService.joinProject(projectId, token);

    socket.on("error", (err) => {
      toast.error(err.error || "Socket error");
    });

    return () => {
      socketService.leaveProject(projectId);
      socketService.disconnect();
    };
  }, [projectId, token]);

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