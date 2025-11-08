import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Mail,
  X,
  ArrowLeft,
  Palette,
  CheckCircle2,
  XCircle,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { usePMStore } from "../store/pmStore";
import { projectsAPI } from "../utils/api";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import TeamMembers from "../components/pm/TeamMembers";

const Teams = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const {
    team,
    loading,
    fetchTeam,
    createTeam,
    updateTeam,
    inviteMember,
    removeMember,
    createPMProject,
    fetchPMProjectByDesign,
  } = usePMStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPMProjectModal, setShowPMProjectModal] = useState(false);
  const [designProjects, setDesignProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    role: "member",
    designProjectId: "",
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await createTeam({
        name: formData.name,
        description: formData.description,
      });
      toast.success("Team created successfully!");
      setShowCreateModal(false);
      setFormData({ name: "", description: "" });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create team");
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    try {
      await inviteMember(team._id, formData.email, formData.role);
      toast.success("Member invited successfully!");
      setShowInviteModal(false);
      setFormData({ ...formData, email: "", role: "member" });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to invite member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMember(team._id, memberId);
      toast.success("Member removed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove member");
    }
  };

  const loadDesignProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data } = await projectsAPI.getAll();
      setDesignProjects(data.projects || []);
    } catch (error) {
      toast.error("Failed to load design projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreatePMProject = async (e) => {
    e.preventDefault();
    if (!formData.designProjectId) return;

    try {
      // Check if PM project already exists
      const existingPM = await fetchPMProjectByDesign(formData.designProjectId);
      if (existingPM) {
        toast.error("This design project already has a PM project");
        return;
      }

      const pmProject = await createPMProject(
        team._id,
        formData.designProjectId
      );
      toast.success("PM project created successfully!");
      setShowPMProjectModal(false);
      setFormData({ ...formData, designProjectId: "" });
      if (pmProject?._id) {
        navigate(`/pm-projects/${pmProject._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create PM project");
    }
  };

  const isOwner = team?.owner?._id === user?._id;
  const isAdmin =
    isOwner ||
    team?.members?.some((m) => m.user._id === user?._id && m.role === "admin");

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-pink-950/20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-[60] border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-75 animate-pulse" />
                <Users className="relative w-10 h-10 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                teams
              </h1>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          </div>
        ) : !team ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="relative inline-block mb-8">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
              <Users className="relative w-24 h-24 text-gray-600" />
            </div>
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 mb-3">
              No Team Yet
            </h3>
            <p className="text-gray-500 mb-8 text-lg max-w-md mx-auto">
              Create a team to start managing projects collaboratively
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
            >
              <Plus className="w-6 h-6" />
              Create Your First Team
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Team Info */}
            <CardSpotlight className="bg-black/40">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {team.name}
                  </h2>
                  {team.description && (
                    <p className="text-gray-400">{team.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 hover:from-cyan-600/30 hover:to-purple-600/30 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 text-white rounded-full transition-all duration-300"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Member
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        loadDesignProjects();
                        setShowPMProjectModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-full transition-all duration-300"
                    >
                      <Palette className="w-4 h-4" />
                      Create PM Project
                    </motion.button>
                  </div>
                )}
              </div>

              <TeamMembers team={team} />

              {team.pmProjects && team.pmProjects.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    PM Projects
                  </h3>
                  <div className="space-y-2">
                    {team.pmProjects.map((pmProj) => {
                      const pmProjectId = pmProj._id || pmProj;
                      return (
                        <motion.button
                          key={pmProjectId}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            navigate(`/pm-projects/${pmProjectId}`)
                          }
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 hover:from-cyan-600/30 hover:to-purple-600/30 backdrop-blur-sm border border-cyan-500/30 hover:border-cyan-500/50 text-white rounded-xl transition-all duration-300 font-medium"
                        >
                          <Palette className="w-4 h-4" />
                          {typeof pmProj === "object" && pmProj.name
                            ? pmProj.name
                            : `View PM Project`}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardSpotlight>
          </div>
        )}
      </main>

      {/* Create Team Modal */}
      {showCreateModal && (
        <Modal
          title="Create Team"
          onClose={() => {
            setShowCreateModal(false);
            setFormData({ name: "", description: "" });
          }}
        >
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="Team name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                placeholder="Team description"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
              >
                Create Team
              </motion.button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <Modal
          title="Invite Member"
          onClose={() => {
            setShowInviteModal(false);
            setFormData({ ...formData, email: "", role: "member" });
          }}
        >
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                placeholder="member@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-800 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="member" className="bg-gray-800 text-white">
                  Member
                </option>
                <option value="admin" className="bg-gray-800 text-white">
                  Admin
                </option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
              >
                Invite
              </motion.button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create PM Project Modal */}
      {showPMProjectModal && (
        <Modal
          title="Create PM Project"
          onClose={() => {
            setShowPMProjectModal(false);
            setFormData({ ...formData, designProjectId: "" });
          }}
        >
          <form onSubmit={handleCreatePMProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Design Project *
              </label>
              {loadingProjects ? (
                <div className="text-center py-4 text-gray-400">Loading...</div>
              ) : (
                <select
                  value={formData.designProjectId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      designProjectId: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 bg-gray-800 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  <option value="" className="bg-gray-800 text-white">
                    Select a design project
                  </option>
                  {designProjects.map((project) => (
                    <option
                      key={project._id}
                      value={project._id}
                      className="bg-gray-800 text-white"
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPMProjectModal(false)}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!formData.designProjectId || loadingProjects}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Create PM Project
              </motion.button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ title, children, onClose }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-xl opacity-75" />
          <div className="relative bg-black border border-white/20 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Teams;
