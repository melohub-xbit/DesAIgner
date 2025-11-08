import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
// import { BackgroundLines } from "../components/ui/BackgroundLines";
import { Spotlight } from "../components/ui/spotlight-new";
import { CanvasRevealEffect, Card } from "../components/ui/CanvasRevealEffect";
import { CardSpotlight } from "../components/ui/CardSpotlight";
import { EvervaultCard } from "../components/ui/EvervaultCard";
import { TextHoverEffect } from "../components/ui/TextHoverEffect";
import { Sparkles, Zap, Users, ArrowRight, Palette, Info, Globe } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-75 animate-pulse" />
                <Palette className="relative w-8 h-8 text-cyan-400" />
              </div>
              <Link to="/home">
                <h1 className="text-2xl font-bold font-heading bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
                  des-ai-gner
                </h1>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Link to="/community">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-full transition-all duration-300"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Community</span>
                </motion.button>
              </Link>
              <Link to="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-full transition-all duration-300"
                >
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">About Us</span>
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white rounded-full transition-all duration-300"
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section with Spotlight */}
      <Spotlight />
      <section className="min-h-screen relative flex items-center justify-center bg-black/[0.96] antialiased bg-grid-white/[0.02] overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="font-heading text-7xl p-10 md:text-8xl lg:text-9xl font-normal bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-6">
                des-ai-gner
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              Design collaboratively in real-time with the power of AI.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Create. Collaborate. Innovate.
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
            >
              <Link to="/register">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/login">
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300">
                  Sign In
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Text Hover Effect Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="h-[40rem] flex items-center justify-center"
          >
            <TextHoverEffect text="DESIGN" />
          </motion.div>
        </div>
      </section>

      {/* Single Unified Section - Why DesAIgner? */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/10 to-black" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-heading h-28 text-5xl md:text-6xl font-normal mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600">
              why des-ai-gner?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The only design tool you'll ever need
            </p>
          </motion.div>

          {/* Canvas Reveal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card
                title="real-time collaboration"
                icon={<Users className="w-16 h-16 text-cyan-500" />}
                description="Work together seamlessly with your team in real-time. See changes instantly as they happen."
              >
                <CanvasRevealEffect
                  animationSpeed={3}
                  containerClassName="bg-black"
                  colors={[[0, 255, 255]]}
                  dotSize={2}
                />
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Card
                title="ai-powered design"
                icon={<Sparkles className="w-16 h-16 text-purple-500" />}
                description="Let AI assist your creative process. Generate, enhance, and optimize designs with intelligent suggestions."
              >
                <CanvasRevealEffect
                  animationSpeed={3}
                  containerClassName="bg-black"
                  colors={[[168, 85, 247]]}
                  dotSize={2}
                />
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Card
                title="lightning fast"
                icon={<Zap className="w-16 h-16 text-yellow-500" />}
                description="Built for speed and performance. Experience smooth, responsive design workflows without lag."
              >
                <CanvasRevealEffect
                  animationSpeed={3}
                  containerClassName="bg-black"
                  colors={[[234, 179, 8]]}
                  dotSize={2}
                />
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-950/30 to-black" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-8 p-12 rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm"
          >
            <h2 className="font-heading text-5xl p-5 md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
              ready to create?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of designers already using DesAIgner to bring their
              ideas to life.
            </p>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 mt-4 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 inline-flex items-center gap-3"
              >
                Start Designing Now
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left text-gray-400">
              <p className="text-sm">
                © 2025 DesAIgner. Built with passion for creators.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
