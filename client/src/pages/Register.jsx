import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Sparkles, ArrowRight, Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";
import { useAuthStore } from "../store/authStore";
import { Spotlight } from "../components/ui/spotlight-new";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const { data } = await authAPI.register(registerData);
      setAuth(data.user, data.token);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <Spotlight />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -right-48 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Register Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl">
            {/* Mobile Title */}
            <div className="md:hidden mb-8 text-center">
              <Link to="/">
                <h1 className="p-5 font-heading text-5xl font-normal bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-2">
                  des-ai-gner
                </h1>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Create Account
              </h2>
              <p className="text-gray-400">Start your creative journey today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Username
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-6"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Sign In Link */}
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/5 border border-white/10 text-white font-semibold py-3.5 rounded-xl transition-all hover:bg-white/10 hover:border-white/20 flex items-center justify-center gap-2"
              >
                Sign In Instead
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>

            {/* Back to Home */}
            <Link
              to="/"
              className="block text-center mt-6 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </motion.div>

        {/* Right Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block space-y-6"
        >
          <Link to="/" className="inline-block">
            <motion.h1
              className="font-heading p-8 text-6xl lg:text-7xl font-normal bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
              whileHover={{ scale: 1.05 }}
            >
              des-ai-gner
            </motion.h1>
          </Link>

          <p className="text-2xl text-gray-300 leading-relaxed">
            Join thousands of creators building amazing designs
          </p>

          <div className="space-y-4 pt-8">
            {[
              {
                icon: Sparkles,
                text: "Access AI-Powered Tools",
                color: "from-cyan-500/20 to-blue-500/20",
                iconColor: "text-cyan-400",
              },
              {
                icon: UserPlus,
                text: "Collaborate in Real-time",
                color: "from-blue-500/20 to-purple-500/20",
                iconColor: "text-blue-400",
              },
              {
                icon: ArrowRight,
                text: "Start Creating Today",
                color: "from-purple-500/20 to-pink-500/20",
                iconColor: "text-purple-400",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-gray-400"
              >
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center border border-white/10`}
                >
                  <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <span className="text-lg">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
