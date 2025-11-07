import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { projectsAPI } from "../utils/api";
import ShareModal from "../components/modals/ShareModals";
import JoinProjectModal from "../components/modals/JoinProjectModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects || []);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    const name = prompt("Enter project name:");
    if (!name) return;

    try {
      const { data } = await projectsAPI.create({ name });
      toast.success("Project created");
      navigate(`/editor/${data.project._id}`);
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await projectsAPI.delete(id);
      toast.success("Project deleted");
      loadProjects();
    } catch {
      toast.error("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-semibold">Your Projects</h1>
  <div className="flex gap-2">
    <button
      onClick={() => setShowJoinModal(true)}
      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
    >
      Join via Code
    </button>
    <button
      onClick={handleCreate}
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
    >
      + New Project
    </button>
  </div>
</div>

      {projects.length === 0 ? (
        <p className="text-gray-400">No projects yet. Create one to start!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projects.map((p) => (
            <div
              key={p._id}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors border border-gray-700 relative"
            >
              <h2 className="text-lg font-medium truncate mb-2">{p.name}</h2>
              <p className="text-sm text-gray-400 truncate mb-4">
                {p.description || "No description"}
              </p>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigate(`/editor/${p._id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1 rounded"
                >
                  Open
                </button>

                <button
                  onClick={() => setSelectedProject(p._id)}
                  className="text-gray-300 hover:text-blue-400 text-sm"
                >
                  Invite
                </button>

                <button
                  onClick={() => handleDelete(p._id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <ShareModal
          projectId={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
      {showJoinModal && (
        <JoinProjectModal
          onClose={() => setShowJoinModal(false)}
          onJoined={loadProjects}
        />
      )}
    </div>
  );
};

export default Dashboard;
