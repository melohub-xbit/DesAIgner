import { motion } from "framer-motion";
import TaskCard from "./TaskCard";
import { Plus } from "lucide-react";

const SubtaskList = ({ task, onEdit, onDelete, onCreateSubtask }) => {
  const subtasks = task.subtasks || [];

  if (subtasks.length === 0 && !onCreateSubtask) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {subtasks.length > 0 && (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <TaskCard
              key={subtask._id}
              task={subtask}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateSubtask={onCreateSubtask}
              level={1}
            />
          ))}
        </div>
      )}

      {onCreateSubtask && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCreateSubtask(task)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-xl transition-all duration-300 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Subtask
        </motion.button>
      )}
    </div>
  );
};

export default SubtaskList;

