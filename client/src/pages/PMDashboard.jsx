import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Target,
  Activity,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { usePMStore } from "../store/pmStore";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import ProgressChart from "../components/pm/ProgressChart";

const PMDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    team,
    pmProject,
    tasks,
    loading,
    fetchTeam,
    fetchPMProject,
    fetchTasks,
  } = usePMStore();

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    averageProgress: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (pmProject?._id) {
      fetchTasks(pmProject._id);
    }
  }, [pmProject]);

  useEffect(() => {
    calculateStats();
  }, [tasks, pmProject]);

  const loadData = async () => {
    await fetchTeam();
    if (team?.pmProject) {
      await fetchPMProject(team.pmProject);
    }
  };

  const calculateStats = () => {
    if (!tasks || tasks.length === 0) {
      setStats({
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        averageProgress: 0,
      });
      return;
    }

    const topLevelTasks = tasks.filter((t) => !t.parentTask);
    const totalTasks = topLevelTasks.length;
    const completedTasks = topLevelTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const inProgressTasks = topLevelTasks.filter(
      (t) => t.status === "in-progress"
    ).length;
    const todoTasks = topLevelTasks.filter((t) => t.status === "todo").length;

    const now = new Date();
    const overdueTasks = topLevelTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== "completed"
    ).length;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const averageProgress =
      topLevelTasks.length > 0
        ? Math.round(
            topLevelTasks.reduce((sum, t) => sum + (t.progress || 0), 0) /
              topLevelTasks.length
          )
        : 0;

    setStats({
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      completionRate,
      averageProgress,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <Users className="w-24 h-24 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No Team Found</h2>
            <p className="text-gray-400 mb-8">
              You need to be part of a team to view the dashboard
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/teams")}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl"
            >
              Go to Teams
            </motion.button>
          </div>
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
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-75 animate-pulse" />
                <BarChart3 className="relative w-10 h-10 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                Project Management Dashboard
              </h1>
            </motion.div>
            {pmProject && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/pm-projects/${pmProject._id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
              >
                View PM Project
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Team Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <CardSpotlight className="bg-black/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {team.name}
                </h2>
                <p className="text-gray-400">
                  {team.members?.length + 1 || 1} team member
                  {(team.members?.length + 1 || 1) !== 1 ? "s" : ""}
                </p>
              </div>
              {!pmProject && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/teams")}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 text-white rounded-xl transition-all duration-300 font-medium"
                >
                  Create PM Project
                </motion.button>
              )}
            </div>
          </CardSpotlight>
        </motion.div>

        {pmProject ? (
          <>
            {/* Progress Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <ProgressChart pmProject={pmProject} tasks={tasks} />
            </motion.div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardSpotlight className="bg-black/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Completion Rate</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.completionRate}%
                      </p>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardSpotlight className="bg-black/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Average Progress</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.averageProgress}%
                      </p>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CardSpotlight className="bg-black/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Tasks</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.totalTasks}
                      </p>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardSpotlight className="bg-black/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-white">
                        {stats.overdueTasks}
                      </p>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.div>
            </div>

            {/* Task Status Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <CardSpotlight className="bg-black/40">
                <h3 className="text-xl font-bold text-white mb-6">
                  Task Status Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">
                      {stats.completedTasks}
                    </div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {stats.inProgressTasks}
                    </div>
                    <div className="text-sm text-gray-400">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-400 mb-2">
                      {stats.todoTasks}
                    </div>
                    <div className="text-sm text-gray-400">To Do</div>
                  </div>
                </div>
              </CardSpotlight>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Target className="w-24 h-24 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">No PM Project Yet</h3>
            <p className="text-gray-400 mb-8">
              Create a PM project linked to a design project to start tracking
              tasks
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/teams")}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl"
            >
              Go to Teams
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PMDashboard;

