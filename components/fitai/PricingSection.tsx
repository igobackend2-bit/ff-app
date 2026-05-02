'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    monthlyPrice: '$9',
    annualPrice: '$89',
    description: 'Perfect for beginners starting their fitness journey.',
    features: ['Basic AI Workout Plans', 'Progress Tracking', 'Community Access', 'Email Support'],
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: '$29',
    annualPrice: '$289',
    description: 'Advanced AI insights for serious athletes.',
    features: ['Ultra-Personalized Workouts', 'Real-Time Posture AI', 'Smart Nutrition Planning', 'Priority Support', 'Advanced Analytics'],
    highlighted: true,
  },
  {
    name: 'Elite',
    monthlyPrice: '$99',
    annualPrice: '$989',
    description: 'Live 1-on-1 coaching powered by our AI models.',
    features: ['Everything in Pro', 'Weekly Virtual Coach Calls', 'Custom Human Review', 'Meal Delivery Integration', '24/7 Slack Support'],
    highlighted: false,
  }
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-zinc-950 relative border-t border-zinc-900">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Simple, Transparent <span className="text-purple-400">Pricing</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Invest in your body. Choose the plan that fits your athletic goals.
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!annual ? 'text-white font-bold' : 'text-zinc-400'}`}>Monthly</span>
            <button 
              onClick={() => setAnnual(!annual)}
              className="relative w-16 h-8 bg-zinc-800 rounded-full p-1 transition-colors hover:bg-zinc-700 focus:outline-none"
            >
              <div 
                className={`w-6 h-6 rounded-full transition-transform duration-300 ${annual ? 'translate-x-8 bg-purple-400' : 'translate-x-0 bg-emerald-400'}`}
              />
            </button>
            <span className={`text-sm ${annual ? 'text-white font-bold' : 'text-zinc-400'}`}>
              Annually <span className="text-emerald-400 ml-1">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {tiers.map((tier, i) => (
            <div 
              key={i}
              className={`relative rounded-3xl p-8 border ${tier.highlighted ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.15)] bg-zinc-900 overflow-hidden' : 'border-zinc-800 bg-zinc-900/50'}`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-purple-500" />
              )}
              
              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
              <p className="text-zinc-400 text-sm mb-6 h-10">{tier.description}</p>
              
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">
                  {annual ? tier.annualPrice : tier.monthlyPrice}
                </span>
                <span className="text-zinc-500">/{annual ? 'year' : 'month'}</span>
              </div>
              
              <button 
                className={`w-full py-4 rounded-xl font-bold transition-all ${tier.highlighted ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
              >
                Get Started
              </button>
              
              <div className="mt-8 space-y-4">
                {tier.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check size={20} className={tier.highlighted ? 'text-emerald-400' : 'text-zinc-500'} />
                    <span className="text-zinc-300 text-sm">{feat}</span>
                  </div>
                ))}
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
