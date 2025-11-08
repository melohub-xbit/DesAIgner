import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  Copy,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Users,
  UserCheck,
  UserCog,
  Globe,
  Globe2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { projectsAPI } from "../utils/api";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "collaborators", label: "Collaborators" },
];

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ProjectSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore((state) => ({ user: state.user }));

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [isInviting, setIsInviting] = useState(false);

  const [inviteCode, setInviteCode] = useState(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  const [pendingRoleUserId, setPendingRoleUserId] = useState(null);
  const [removingUserId, setRemovingUserId] = useState(null);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await projectsAPI.getOne(projectId);
      setProject(data.project);
      setInviteCode(null);
      setHasCopiedCode(false);
    } catch (error) {
      toast.error("Failed to load project settings");
      navigate("/dashboard");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const collaboratorEntries = useMemo(() => {
    if (!project) return [];

    const collaborators = project.collaborators || [];

    const ownerEntry = project.owner
      ? [
          {
            id: project.owner._id,
            role: "owner",
            user: {
              _id: project.owner._id,
              username: project.owner.username,
              email: project.owner.email,
              avatar: project.owner.avatar,
            },
            joinedAt: project.createdAt,
          },
        ]
      : [];

    return [...ownerEntry, ...collaborators];
  }, [project]);

  const isOwner = project?.owner?._id === user?._id;
  const isAdmin = project?.collaborators?.some(
    (collab) => collab.user?._id === user?._id && collab.role === "admin"
  );
  const canManage = isOwner || isAdmin;

  const currentUserRole = useMemo(() => {
    if (isOwner) return "owner";
    const entry = project?.collaborators?.find(
      (collab) => collab.user?._id === user?._id
    );
    return entry?.role || "viewer";
  }, [isOwner, project?.collaborators, user?._id]);

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Enter an email address to invite");
      return;
    }
    setIsInviting(true);
    try {
      const { data } = await projectsAPI.addCollaborator(projectId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setProject(data.project);
      setInviteEmail("");
      toast.success("Collaborator invited successfully");
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to invite collaborator";
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleGenerateInviteCode = async () => {
    setIsGeneratingCode(true);
    setHasCopiedCode(false);
    try {
      const { data } = await projectsAPI.generateInviteCode(projectId);
      setInviteCode(data.code);
      toast.success("New invite code generated");
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to generate invite code";
      toast.error(message);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setHasCopiedCode(true);
      toast.success("Invite code copied to clipboard");
    } catch {
      toast.error("Unable to copy code. Copy it manually instead.");
    }
  };

  const handleRoleChange = async (userId, role) => {
    if (!canManage) return;
    setPendingRoleUserId(userId);
    try {
      const { data } = await projectsAPI.updateCollaboratorRole(
        projectId,
        userId,
        {
          role,
        }
      );
      setProject(data.project);
      toast.success("Collaborator role updated");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to update role";
      toast.error(message);
    } finally {
      setPendingRoleUserId(null);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!canManage) return;
    setRemovingUserId(userId);
    try {
      const { data } = await projectsAPI.removeCollaborator(projectId, userId);
      setProject(data.project);
      toast.success("Collaborator removed");
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to remove collaborator";
      toast.error(message);
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleTogglePublic = async () => {
    if (!isOwner) return;
    setIsTogglingPublic(true);
    try {
      const { data } = await projectsAPI.togglePublic(projectId);
      setProject(data.project);
      toast.success(data.message);
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to update public status";
      toast.error(message);
    } finally {
      setIsTogglingPublic(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
          </div>
          <p className="text-gray-400 mt-4">Loading project settings...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Spotlight Effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-pink-950/20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-gray-200"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                  Project settings
                </h1>
                <p className="text-gray-400 mt-1">
                  {project.name} · Your role: {roleLabels[currentUserRole]}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => loadProject({ silent: true })}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl text-gray-200 transition-all duration-300"
                title="Refresh project details"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Refresh</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={`/editor/${project._id}`}
                  className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 rounded-xl text-white transition-all duration-300 font-medium"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-300" />
                  <ArrowUpRight className="relative w-4 h-4" />
                  <span className="relative text-sm">Open editor</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 border-b border-white/10 mb-8"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-cyan-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.nav>

        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10">
              <section className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Project summary
                </h2>
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <dt>Name</dt>
                    <dd className="font-medium text-white">{project.name}</dd>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <dt>Description</dt>
                    <dd className="text-right max-w-sm text-gray-400">
                      {project.description || "No description yet"}
                    </dd>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <dt>Owner</dt>
                    <dd className="font-medium text-white">
                      {project.owner?.username}
                    </dd>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <dt>Collaborators</dt>
                    <dd className="font-medium text-white">
                      {project.collaborators?.length || 0}
                    </dd>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <dt>Created</dt>
                    <dd className="text-gray-400">
                      {new Date(project.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <dt>Last updated</dt>
                    <dd className="text-gray-400">
                      {new Date(project.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </section>
            </CardSpotlight>

            <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10">
              <section className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Canvas configuration
                </h2>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Dimensions</span>
                    <span className="text-white">
                      {project.canvasSettings?.width} ×{" "}
                      {project.canvasSettings?.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Background</span>
                    <span className="text-white">
                      {project.canvasSettings?.backgroundColor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grid</span>
                    <span className="text-white">
                      {project.canvasSettings?.gridEnabled
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Snap to grid</span>
                    <span className="text-white">
                      {project.canvasSettings?.snapToGrid ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total elements</span>
                    <span className="text-white">
                      {project.elements?.length || 0}
                    </span>
                  </div>
                </div>
              </section>
            </CardSpotlight>

            {isOwner && (
              <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10 lg:col-span-2">
                <section className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    {project.isPublic ? (
                      <Globe className="w-4 h-4 text-green-400" />
                    ) : (
                      <Globe2 className="w-4 h-4 text-gray-400" />
                    )}
                    Community sharing
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium mb-1">
                          {project.isPublic
                            ? "Project is public"
                            : "Project is private"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {project.isPublic
                            ? "Your project is visible to everyone in the community"
                            : "Make your project public to share it with the community"}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTogglePublic}
                        disabled={isTogglingPublic}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                          project.isPublic
                            ? "bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 text-red-400"
                            : "bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isTogglingPublic ? (
                          <>
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : project.isPublic ? (
                          <>
                            <Globe2 className="w-4 h-4" />
                            <span>Make Private</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4" />
                            <span>Publish to Community</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </section>
              </CardSpotlight>
            )}

            <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10 lg:col-span-2">
              <section className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-cyan-400" />
                  Recent activity snapshot
                </h2>
                <p className="text-sm text-gray-400">
                  Activity tracking is coming soon. For now, use the editor
                  history to review recent changes.
                </p>
              </section>
            </CardSpotlight>
          </motion.div>
        )}

        {activeTab === "collaborators" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10">
              <section className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    Manage collaborators
                  </h2>
                  {!canManage && (
                    <span className="text-xs text-gray-400">
                      Only project owners or admins can manage collaborators
                    </span>
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <CardSpotlight className="bg-black/40 border border-white/10">
                    <form
                      onSubmit={handleInviteSubmit}
                      className="p-5 space-y-4"
                    >
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-cyan-400" />
                        Invite by email
                      </h3>
                      <p className="text-xs text-gray-400">
                        Send a direct invitation to someone who already has an
                        account.
                      </p>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        placeholder="colleague@example.com"
                        className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        disabled={!canManage || isInviting}
                        required
                      />
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-400">Role</label>
                        <select
                          value={inviteRole}
                          onChange={(event) =>
                            setInviteRole(event.target.value)
                          }
                          className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                          disabled={!canManage || isInviting}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 rounded-xl text-sm text-white transition-all duration-300 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!canManage || isInviting}
                      >
                        <UserCheck className="w-4 h-4" />
                        {isInviting ? "Sending invite..." : "Send invite"}
                      </motion.button>
                    </form>
                  </CardSpotlight>

                  <CardSpotlight className="bg-black/40 border border-white/10">
                    <div className="p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        Share invite code
                      </h3>
                      <p className="text-xs text-gray-400">
                        Generate a temporary code teammates can use from their
                        dashboard to join this project.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateInviteCode}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl text-sm text-gray-200 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!canManage || isGeneratingCode}
                      >
                        <RefreshCcw
                          className={`w-4 h-4 ${
                            isGeneratingCode ? "animate-spin" : ""
                          }`}
                        />
                        {isGeneratingCode ? "Generating..." : "Generate new code"}
                      </motion.button>
                      {inviteCode && (
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                          <span className="text-lg font-mono tracking-widest text-white">
                            {inviteCode}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyInviteCode}
                            className="ml-auto p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-lg text-gray-200 transition-all duration-300"
                            title="Copy invite code"
                          >
                            {hasCopiedCode ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </motion.button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Codes expire automatically after 24 hours or once
                        disabled by the owner.
                      </p>
                    </div>
                  </CardSpotlight>
                </div>
              </section>
            </CardSpotlight>

            <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10">
              <section className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Collaborator roster
                </h2>

                <div className="border border-white/10 rounded-xl divide-y divide-white/10">
                {collaboratorEntries.map((collaborator, index) => {
                  const collaboratorId =
                    collaborator.user?._id || collaborator.id;
                  const collaboratorRole = collaborator.role;
                  const isCurrent = collaboratorId === user?._id;
                  const isCollaboratorOwner = collaboratorRole === "owner";

                  return (
                    <motion.div
                      key={collaboratorId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 py-4 hover:bg-white/5 transition-colors rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          {collaborator.user?.username ||
                            collaborator.user?.email ||
                            "Unknown user"}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-cyan-400">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {collaborator.user?.email || "Email not available"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col text-xs text-gray-500">
                          <span className="uppercase tracking-wide">
                            {roleLabels[collaboratorRole] || collaboratorRole}
                          </span>
                          {collaboratorRole !== "owner" &&
                            collaborator.joinedAt && (
                              <span>
                                Joined{" "}
                                {new Date(
                                  collaborator.joinedAt
                                ).toLocaleDateString()}
                              </span>
                            )}
                        </div>

                        <select
                          value={collaboratorRole}
                          onChange={(event) => {
                            const nextRole = event.target.value;
                            if (nextRole !== collaboratorRole) {
                              handleRoleChange(collaboratorId, nextRole);
                            }
                          }}
                          disabled={
                            !canManage ||
                            isCollaboratorOwner ||
                            (collaboratorId === user?._id && !isOwner) ||
                            pendingRoleUserId === collaboratorId
                          }
                          className="px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-40"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleRemoveCollaborator(collaboratorId)
                          }
                          disabled={
                            !canManage ||
                            isCollaboratorOwner ||
                            removingUserId === collaboratorId ||
                            collaboratorId === user?._id
                          }
                          className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Remove collaborator"
                        >
                          {removingUserId === collaboratorId ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              </section>
            </CardSpotlight>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ProjectSettings;
