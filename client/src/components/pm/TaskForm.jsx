import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";
import { usePMStore } from "../../store/pmStore";

const TaskForm = ({ task, onClose, pmProjectId, parentTaskId }) => {
  const createTask = usePMStore((state) => state.createTask);
  const updateTask = usePMStore((state) => state.updateTask);
  const team = usePMStore((state) => state.team);
  const pmProject = usePMStore((state) => state.pmProject);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeId: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        assigneeId: task.assignee?._id || "",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        pmProjectId: pmProjectId || pmProject?._id,
        parentTaskId: parentTaskId || task?.parentTask?._id || null,
        priority: formData.priority,
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate || null,
      };

      if (task) {
        await updateTask(task._id, taskData);
      } else {
        await createTask(taskData);
        // Emit socket event for real-time update
        const socket = require("../../utils/socket").default;
        if (socket.socket && pmProject) {
          socket.socket.emit("task-create", {
            pmProjectId: pmProject._id,
            task: { ...taskData, _id: Date.now().toString() },
          });
        }
      }

      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setLoading(false);
    }
  };

  const teamMembers = team?.members || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-black border border-white/20 rounded-3xl p-6"
        >
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-xl opacity-75" />

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {task ? "Edit Task" : "Create Task"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder="Task title"
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
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Assignee
                  </label>
                  <select
                    value={formData.assigneeId}
                    onChange={(e) =>
                      setFormData({ ...formData, assigneeId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.user._id} value={member.user._id}>
                        {member.user.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 focus:border-cyan-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-xl transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save"}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskForm;

