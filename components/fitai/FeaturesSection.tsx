'use client';

import { motion } from 'framer-motion';
import { Brain, Camera, Apple, Dumbbell } from 'lucide-react';

const features = [
  {
    title: 'AI Workout Plans',
    description: 'Our neural engine generates ultra-personalized workouts that adapt in real-time to your gains and fatigue.',
    icon: Brain,
    color: 'emerald'
  },
  {
    title: 'Posture Tracking',
    description: 'Using your phone camera, FitAI analyzes your form to ensure perfect execution and prevent injuries.',
    icon: Camera,
    color: 'purple'
  },
  {
    title: 'Smart Nutrition',
    description: 'Get daily macro targets and recipe suggestions based on your biometric data and fitness goals.',
    icon: Apple,
    color: 'emerald'
  },
  {
    title: 'Progress Analytics',
    description: 'Deep dive into your performance with stunning charts that predict your 1RM and growth trajectory.',
    icon: Dumbbell,
    color: 'purple'
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-zinc-950 relative border-t border-zinc-900 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Engineered for <span className="text-emerald-400">Peak Performance</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Say goodbye to cookie-cutter programs. Experience the future of fitness with cutting-edge AI technologies designed just for your body.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const isEmerald = feature.color === 'emerald';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`group relative bg-zinc-900 border ${isEmerald ? 'border-zinc-800 hover:border-emerald-500/50' : 'border-zinc-800 hover:border-purple-500/50'} p-8 rounded-3xl transition-all duration-300 hover:shadow-2xl ${isEmerald ? 'hover:shadow-emerald-500/10' : 'hover:shadow-purple-500/10'}`}
              >
                <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-colors ${isEmerald ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-purple-500/10 group-hover:bg-purple-500/20'}`}>
                  <Icon size={28} className={isEmerald ? 'text-emerald-400' : 'text-purple-400'} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
