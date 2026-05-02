'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Activity, Zap, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-screen flex items-center">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 mb-8">
              <Zap size={16} className="text-emerald-400" />
              <span className="text-sm font-medium tracking-wide">Next-Gen AI Fitness</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
              Train Smarter <br />
              With <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">FitAI</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto lg:mx-0">
              The ultimate AI-powered fitness companion that builds ultra-personalized workout plans, tracks your posture in real-time, and optimizes your nutrition.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link 
                href="#pricing"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                Start Free Trial
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-full border border-zinc-800 transition-colors"
              >
                Explore Features
              </Link>
            </div>
          </motion.div>

          {/* Dynamic Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] flex justify-center items-center mt-12 lg:mt-0"
          >
            {/* Phone Frame */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative w-[320px] h-[650px] bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl p-6 overflow-hidden flex flex-col z-20"
            >
              {/* Fake App Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-white font-bold text-xl">Good Morning!</h3>
                  <p className="text-emerald-400 text-sm">Today's AI Plan</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                  <Activity size={20} className="text-purple-400" />
                </div>
              </div>

              {/* Fake Activity Rings */}
              <div className="flex justify-center mb-10">
                <div className="relative w-40 h-40 rounded-full border-4 border-zinc-800 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-[spin_3s_linear_infinite]" />
                  <div className="text-center">
                    <span className="text-3xl font-extrabold text-white">85</span>
                    <span className="text-emerald-400 text-sm block">Score</span>
                  </div>
                </div>
              </div>

              {/* Fake Workout Cards */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-800/50 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <HeartPulse size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="h-4 w-24 bg-zinc-700 rounded mb-2" />
                      <div className="h-3 w-16 bg-zinc-600 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Fade out bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
            </motion.div>

            {/* Orbiting Elements */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute w-[450px] h-[450px] border border-zinc-800/50 rounded-full z-10"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute w-[550px] h-[550px] border border-purple-900/30 rounded-full z-10"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
