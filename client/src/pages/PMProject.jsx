import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { usePMStore } from "../store/pmStore";
import socketService from "../utils/socket";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import TaskCard from "../components/pm/TaskCard";
import TaskForm from "../components/pm/TaskForm";
import ProgressChart from "../components/pm/ProgressChart";
import TeamMembers from "../components/pm/TeamMembers";

const PMProject = () => {
  const { pmProjectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const {
    pmProject,
    tasks,
    team,
    loading,
    fetchPMProject,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setupPMSocketListeners,
    cleanupPMSocketListeners,
    joinPMProject,
    leavePMProject,
  } = usePMStore();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentTask, setParentTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (pmProjectId) {
      fetchPMProject(pmProjectId).then(() => {
        fetchTasks(pmProjectId);
      });
    }

    return () => {
      if (pmProjectId) {
        leavePMProject(pmProjectId);
        cleanupPMSocketListeners();
      }
    };
  }, [pmProjectId]);

  useEffect(() => {
    if (pmProject && token) {
      setupPMSocketListeners();
      joinPMProject(pmProject._id, token);
    }
  }, [pmProject, token]);

  useEffect(() => {
    if (pmProject?._id) {
      fetchTasks(pmProject._id);
    }
  }, [pmProject]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setParentTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setParentTask(null);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(task._id);
      // Emit socket event
      if (socketService.socket && pmProject) {
        socketService.socket.emit("task-delete", {
          pmProjectId: pmProject._id,
          taskId: task._id,
        });
      }
      toast.success("Task deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleCreateSubtask = (parentTask) => {
    setEditingTask(null);
    setParentTask(parentTask);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    setParentTask(null);
  };

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === "all") return !task.parentTask;
    return !task.parentTask && task.status === statusFilter;
  });

  const topLevelTasks = tasks.filter((t) => !t.parentTask);

  if (loading && !pmProject) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!pmProject) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">PM Project not found</h2>
          <button
            onClick={() => navigate("/teams")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl"
          >
            Go to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
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
                onClick={() => navigate("/teams")}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{pmProject.name}</h1>
                {pmProject.designProject && (
                  <p className="text-sm text-gray-400">
                    Design Project: {pmProject.designProject.name}
                  </p>
                )}
              </div>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateTask}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
            >
              <Plus className="w-5 h-5" />
              New Task
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Chart */}
            <ProgressChart pmProject={pmProject} tasks={tasks} />

            {/* Filter */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="flex gap-2">
                {["all", "todo", "in-progress", "review", "completed"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === status
                          ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {status.replace("-", " ")}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <CardSpotlight className="bg-black/40 text-center py-12">
                  <p className="text-gray-400">No tasks found</p>
                </CardSpotlight>
              ) : (
                filteredTasks.map((task) => (
                  <div key={task._id}>
                    <TaskCard
                      task={task}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onCreateSubtask={handleCreateSubtask}
                    />
                    {/* Render subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-2 ml-6 space-y-2">
                        {task.subtasks.map((subtask) => (
                          <TaskCard
                            key={subtask._id}
                            task={subtask}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onCreateSubtask={handleCreateSubtask}
                            level={1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Team & Info */}
          <div className="space-y-6">
            <TeamMembers team={team} />

            {/* Project Status */}
            <CardSpotlight className="bg-black/40">
              <h3 className="text-lg font-semibold text-white mb-4">
                Project Status
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className="text-sm font-medium text-white capitalize">
                      {pmProject.status}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${pmProject.progress || 0}%` }}
                    />
                  </div>
                </div>
                {pmProject.startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    Started: {new Date(pmProject.startDate).toLocaleDateString()}
                  </div>
                )}
                {pmProject.endDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Due: {new Date(pmProject.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardSpotlight>
          </div>
        </div>
      </main>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onClose={handleCloseTaskForm}
          pmProjectId={pmProject._id}
          parentTaskId={parentTask?._id}
        />
      )}
    </div>
  );
};

export default PMProject;

