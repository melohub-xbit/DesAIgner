import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const ProgressChart = ({ pmProject, tasks = [] }) => {
  const progress = pmProject?.progress || 0;
  const totalTasks = tasks.filter((t) => !t.parentTask).length;
  const completedTasks = tasks.filter(
    (t) => !t.parentTask && t.status === "completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (t) => !t.parentTask && t.status === "in-progress"
  ).length;
  const todoTasks = tasks.filter(
    (t) => !t.parentTask && t.status === "todo"
  ).length;

  const statusColors = {
    planning: "from-gray-500 to-gray-600",
    "in-progress": "from-blue-500 to-cyan-500",
    completed: "from-green-500 to-emerald-500",
    "on-hold": "from-yellow-500 to-orange-500",
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            {progress}%
          </span>
        </div>
        <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${statusColors[pmProject?.status || "planning"]} rounded-full`}
          />
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-white">{completedTasks}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-white">{inProgressTasks}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">To Do</span>
          </div>
          <p className="text-2xl font-bold text-white">{todoTasks}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalTasks}</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressChart;

