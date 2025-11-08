import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Palette,
  Sparkles,
  Users,
  Zap,
  Code,
  Heart,
  Github,
  Linkedin,
  Mail,
  ArrowLeft,
  LogOut,
  ChevronDown,
  FolderOpen,
  Share2,
} from "lucide-react";
import { Spotlight } from "../components/ui/spotlight-new";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import { useAuthStore } from "../store/authStore";

// Import team member images
// Note: Add your team member images to src/assets/ folder with these names:
// - team-member-1.jpg (or .png, .jpeg, .webp)
// - team-member-2.jpg (or .png, .jpeg, .webp)
// - team-member-3.jpg (or .png, .jpeg, .webp)
// If images are not found, a gradient placeholder with initials will be shown

// Try to import images - if they don't exist, they'll be null
// Update the paths below to match your actual image file names and extensions
let teamMember1 = null;
let teamMember2 = null;
let teamMember3 = null;

try {
  teamMember1 = new URL("../assets/teammember1.jpg", import.meta.url).href;
} catch (e) {
  // Image not found, will use placeholder
}

try {
  teamMember2 = new URL("../assets/temmember2.jpg", import.meta.url).href;
} catch (e) {
  // Image not found, will use placeholder
}

try {
  teamMember3 = new URL("../assets/teammember3.jpg", import.meta.url).href;
} catch (e) {
  // Image not found, will use placeholder
}

// Team member data - Update these with actual team member info
const teamMembers = [
  {
    id: 1,
    name: "Chaitya Shah",
    role: "Full Stack Developer",
    bio: "Passionate about creating seamless user experiences and building scalable applications.",
    image: teamMember1,
    github: "https://github.com/CShah44",
    linkedin: "https://www.linkedin.com/in/chaitya-shah-0a7589267/",
    email: "chaityashah36@gmail.com",
  },
  {
    id: 2,
    name: "Krish Patel",
    role: "Full Stack Developer",
    bio: "Design enthusiast focused on creating beautiful and intuitive interfaces that users love.",
    image: teamMember2,
    github: "https://github.com/kodercrish",
    linkedin: "https://www.linkedin.com/in/krish-patel-aa235a300/",
    email: "krishbipinpatel3@gmail.com",
  },
  {
    id: 3,
    name: "Krishna Sai",
    role: "Full Stack Developer",
    bio: "Expert in building robust backend systems and optimizing performance for better scalability.",
    image: teamMember3,
    github: "https://github.com/melohub-xbit",
    linkedin: "https://www.linkedin.com/in/krishna-sai-velidanda-8h0oth-pu4/",
    email: "kvelidanda@gmail.com",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Design",
    description:
      "Leverage cutting-edge AI to get intelligent design suggestions and automate repetitive tasks.",
  },
  {
    icon: Users,
    title: "Real-Time Collaboration",
    description:
      "Work together seamlessly with your team in real-time, seeing changes as they happen.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built for performance with instant updates and smooth interactions, even with complex designs.",
  },
  {
    icon: Code,
    title: "Developer Friendly",
    description:
      "Export clean code, integrate with your workflow, and customize everything to your needs.",
  },
];

const About = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    publicProjects: 0,
  });

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    // Load user stats when authenticated
    const loadUserStats = async () => {
      if (isAuthenticated) {
        try {
          const { projectsAPI } = await import("../utils/api");
          const { data } = await projectsAPI.getAll();
          const total = data.projects.length;
          const publicCount = data.projects.filter((p) => p.isPublic).length;
          setUserStats({
            totalProjects: total,
            publicProjects: publicCount,
          });
        } catch (error) {
          console.error("Failed to load user stats:", error);
        }
      }
    };

    loadUserStats();
  }, [isAuthenticated]);

  const handleBack = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/home");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/home");
  };

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
      <header className="relative z-[60] border-b border-white/10 bg-black/50 backdrop-blur-xl">
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
                onClick={handleBack}
                className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-gray-200"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-75 animate-pulse" />
                <Palette className="relative w-10 h-10 text-cyan-400" />
              </div>
              <h1 className="text-3xl py-5 font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                des-ai-gner
              </h1>
            </motion.div>
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                {/* User Profile Dropdown */}
                <div className="relative user-menu-container">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-full transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-gray-300 font-medium">
                      {user?.username}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showUserMenu ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                      >
                        {/* User Info Section */}
                        <div className="p-4 border-b border-white/10 bg-gradient-to-br from-cyan-500/10 to-purple-500/10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-lg font-bold">
                              {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold text-base">
                                {user?.username}
                              </p>
                              <p className="text-gray-400 text-xs truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>

                          {/* User Statistics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/5">
                              <div className="flex items-center gap-2 mb-1">
                                <FolderOpen className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs text-gray-400">
                                  Projects
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-white">
                                {userStats.totalProjects}
                              </p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/5">
                              <div className="flex items-center gap-2 mb-1">
                                <Share2 className="w-4 h-4 text-purple-400" />
                                <span className="text-xs text-gray-400">
                                  Public
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-white">
                                {userStats.publicProjects}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions Section */}
                        <div className="p-3">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Logout</p>
                              <p className="text-xs text-gray-400">
                                Sign out of your account
                              </p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-cyan-200 mb-6">
            about us
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We're building the future of collaborative design, where creativity
            meets innovation and AI empowers every creator.
          </p>
        </motion.div>

        {/* Platform Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30">
                  <Palette className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Our Mission
                </h3>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                DesAIgner is a revolutionary collaborative design platform that
                combines the power of artificial intelligence with real-time
                collaboration tools. We believe that great design should be
                accessible to everyone, and that working together should be
                seamless and inspiring.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Our platform empowers teams to create stunning designs,
                collaborate in real-time, and leverage AI assistance to bring
                their creative visions to life. Whether you're a solo designer
                or part of a large team, DesAIgner provides the tools and
                features you need to turn ideas into reality.
              </p>
            </div>
          </CardSpotlight>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            What Makes Us Special
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10 h-full">
                    <div className="p-6">
                      <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/30 w-fit mb-4">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h4 className="text-xl font-semibold text-white mb-3">
                        {feature.title}
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </CardSpotlight>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            Meet the Team
          </h3>
          <p className="text-center text-gray-400 mb-12">
            The passionate creators behind DesAIgner
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10">
                  <div className="p-6 text-center">
                    {/* Team Member Image */}
                    <div className="relative mb-6 mx-auto w-32 h-32">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" />
                      <div
                        className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 ${
                          !member.image
                            ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center"
                            : ""
                        }`}
                      >
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to gradient if image not found
                              e.target.style.display = "none";
                              e.target.parentElement.className +=
                                " bg-gradient-to-br from-cyan-500/20 to-purple-500/20";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/50">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xl font-semibold text-white mb-2">
                      {member.name}
                    </h4>
                    <p className="text-cyan-400 mb-4 text-sm font-medium">
                      {member.role}
                    </p>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center justify-center gap-3">
                      <motion.a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-300"
                        title="GitHub"
                      >
                        <Github className="w-4 h-4" />
                      </motion.a>
                      <motion.a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-300"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </motion.a>
                      <motion.a
                        href={`mailto:${member.email}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-300"
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </motion.a>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <CardSpotlight className="bg-black/50 backdrop-blur-xl border border-white/10">
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                <h3 className="text-2xl md:text-3xl font-bold text-white">
                  Built with Passion
                </h3>
              </div>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                We're constantly improving and adding new features based on your
                feedback. Join us on this journey to revolutionize the way we
                design and collaborate.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/home"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 rounded-full font-semibold text-lg transition-all duration-300"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-300" />
                  <span className="relative">Get Started</span>
                  <Sparkles className="relative w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </CardSpotlight>
        </motion.div>
      </main>
    </div>
  );
};

export default About;
