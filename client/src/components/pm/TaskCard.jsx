import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { usePMStore } from "../../store/pmStore";
import socketService from "../../utils/socket";

const statusColors = {
  todo: "text-gray-400",
  "in-progress": "text-blue-400",
  review: "text-yellow-400",
  completed: "text-green-400",
};

const priorityColors = {
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const TaskCard = ({ task, onEdit, onDelete, onCreateSubtask, level = 0 }) => {
  const [showMenu, setShowMenu] = useState(false);
  const updateTaskStatus = usePMStore((state) => state.updateTaskStatus);
  const pmProject = usePMStore((state) => state.pmProject);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTaskStatus(task._id, newStatus);
      // Emit socket event for real-time update
      if (socketService.socket && pmProject) {
        socketService.socket.emit("task-status-change", {
          pmProjectId: pmProject._id,
          taskId: task._id,
          status: newStatus,
        });
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "in-progress":
        return <Circle className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300 ${
        level > 0 ? "ml-6 border-l-2 border-l-purple-500/30" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status Checkbox */}
        <button
          onClick={() =>
            handleStatusChange(
              task.status === "completed" ? "todo" : "completed"
            )
          }
          className={`mt-1 transition-colors ${
            task.status === "completed"
              ? "text-green-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          {getStatusIcon()}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3
                className={`font-semibold text-white mb-2 ${
                  task.status === "completed"
                    ? "line-through text-gray-500"
                    : ""
                }`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Task Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Priority */}
                <span
                  className={`px-2 py-1 rounded-full border ${priorityColors[task.priority]}`}
                >
                  {task.priority}
                </span>

                {/* Status */}
                {task.status && (
                  <span
                    className={`flex items-center gap-1 ${statusColors[task.status] || statusColors.todo}`}
                  >
                    {task.status.replace("-", " ")}
                  </span>
                )}

                {/* Due Date */}
                {task.dueDate && (
                  <span
                    className={`flex items-center gap-1 ${
                      isOverdue ? "text-red-400" : "text-gray-400"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}

                {/* Assignee */}
                {task.assignee && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <User className="w-3 h-3" />
                    {task.assignee.username}
                  </span>
                )}

                {/* Subtasks Count */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="text-gray-400">
                    {task.subtasks.filter((st) => st.status === "completed").length}/
                    {task.subtasks.length} subtasks
                  </span>
                )}

                {/* Progress */}
                {task.progress !== undefined && (
                  <span className="text-gray-400">{task.progress}%</span>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-10 min-w-[150px]">
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  {onCreateSubtask && (
                    <button
                      onClick={() => {
                        onCreateSubtask(task);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Subtask
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDelete(task);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Overdue Warning */}
          {isOverdue && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              Overdue
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;

