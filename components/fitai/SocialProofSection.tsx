'use client';

import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Alex Rivera',
    handle: '@arivera_fit',
    text: '"FitAI completely changed my workouts. The real-time form tracking is like having a personal trainer in my pocket."',
  },
  {
    name: 'Sarah Jenkins',
    handle: '@sarahj_lifts',
    text: '"I\'ve broken through a 6-month plateau thanks to the AI-adjusted sets and macro planning. Absolutely unreal tech."',
  },
  {
    name: 'Marcus Chen',
    handle: '@marcus_c',
    text: '"The sleekest UI of any fitness app I\'ve used. But more importantly, the insights actually make sense and get results."',
  },
  {
    name: 'Emily Davis',
    handle: '@emily_fitlife',
    text: '"Neon greens and dark mode? Sign me up. Oh, and the personalized cardio routines are actually fun now!"',
  },
  {
    name: 'David Kim',
    handle: '@dkim_strong',
    text: '"Unbelievable. The vision AI caught my knee caving in during squats. Saved me from a serious injury."',
  }
];

export default function SocialProofSection() {
  return (
    <section className="py-24 bg-zinc-950 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white">
          Trusted by <span className="text-purple-400">10,000+</span> Athletes
        </h2>
      </div>

      <div className="relative flex overflow-x-hidden">
        {/* Left/Right Fading Edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
        
        <div className="py-12 animate-marquee whitespace-nowrap flex gap-6">
          {/* Double array for infinite seamless scroll */}
          {[...testimonials, ...testimonials].map((t, idx) => (
            <div 
              key={idx} 
              className="w-[350px] inline-block bg-zinc-900 border border-zinc-800 rounded-2xl p-6 whitespace-normal"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-purple-500 p-0.5">
                  <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {t.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-bold">{t.name}</h4>
                  <p className="text-zinc-500 text-sm">{t.handle}</p>
                </div>
              </div>
              <p className="text-zinc-300 italic">
                {t.text}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tailwind config missing animate-marquee out of the box, we inject it inline here or via style */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
}
