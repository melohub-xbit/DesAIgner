import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { projectsAPI } from "../utils/api";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading project settings...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-16">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-200"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Project settings
              </h1>
              <p className="text-gray-400">
                {project.name} · Your role: {roleLabels[currentUserRole]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadProject({ silent: true })}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 transition-colors"
              title="Refresh project details"
            >
              <RefreshCcw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="text-sm">Refresh</span>
            </button>
            <Link
              to={`/editor/${project._id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-sm">Open editor</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <nav className="flex gap-4 border-b border-gray-700 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
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

            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
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

            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-400" />
                Recent activity snapshot
              </h2>
              <p className="text-sm text-gray-400">
                Activity tracking is coming soon. For now, use the editor
                history to review recent changes.
              </p>
            </section>
          </div>
        )}

        {activeTab === "collaborators" && (
          <div className="space-y-6">
            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Manage collaborators
                </h2>
                {!canManage && (
                  <span className="text-xs text-gray-400">
                    Only project owners or admins can manage collaborators
                  </span>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  onSubmit={handleInviteSubmit}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-5 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-blue-400" />
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
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!canManage || isInviting}
                    required
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-400">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(event) => setInviteRole(event.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!canManage || isInviting}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors disabled:opacity-60"
                    disabled={!canManage || isInviting}
                  >
                    <UserCheck className="w-4 h-4" />
                    {isInviting ? "Sending invite..." : "Send invite"}
                  </button>
                </form>

                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    Share invite code
                  </h3>
                  <p className="text-xs text-gray-400">
                    Generate a temporary code teammates can use from their
                    dashboard to join this project.
                  </p>
                  <button
                    onClick={handleGenerateInviteCode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors disabled:opacity-60"
                    disabled={!canManage || isGeneratingCode}
                  >
                    <RefreshCcw
                      className={`w-4 h-4 ${
                        isGeneratingCode ? "animate-spin" : ""
                      }`}
                    />
                    {isGeneratingCode ? "Generating..." : "Generate new code"}
                  </button>
                  {inviteCode && (
                    <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                      <span className="text-lg font-mono tracking-widest text-white">
                        {inviteCode}
                      </span>
                      <button
                        onClick={handleCopyInviteCode}
                        className="ml-auto p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition-colors"
                        title="Copy invite code"
                      >
                        {hasCopiedCode ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Codes expire automatically after 24 hours or once disabled
                    by the owner.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Collaborator roster
              </h2>

              <div className="border border-gray-700 rounded-lg divide-y divide-gray-700">
                {collaboratorEntries.map((collaborator) => {
                  const collaboratorId =
                    collaborator.user?._id || collaborator.id;
                  const collaboratorRole = collaborator.role;
                  const isCurrent = collaboratorId === user?._id;
                  const isCollaboratorOwner = collaboratorRole === "owner";

                  return (
                    <div
                      key={collaboratorId}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 py-4"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          {collaborator.user?.username ||
                            collaborator.user?.email ||
                            "Unknown user"}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-blue-400">
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
                          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() =>
                            handleRemoveCollaborator(collaboratorId)
                          }
                          disabled={
                            !canManage ||
                            isCollaboratorOwner ||
                            removingUserId === collaboratorId ||
                            collaboratorId === user?._id
                          }
                          className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 transition-colors disabled:opacity-40"
                          title="Remove collaborator"
                        >
                          {removingUserId === collaboratorId ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectSettings;
