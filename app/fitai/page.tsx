import HeroSection from '@/components/fitai/HeroSection';
import FeaturesSection from '@/components/fitai/FeaturesSection';
import SocialProofSection from '@/components/fitai/SocialProofSection';
import PricingSection from '@/components/fitai/PricingSection';

export const metadata = {
  title: 'FitAI - Next-Gen AI Fitness',
  description: 'The ultimate AI-powered fitness companion that builds ultra-personalized workout plans.',
};

export default function FitAIPage() {
  return (
    <main className="min-h-screen bg-zinc-950 selection:bg-emerald-500/30">
      {/* 
        This is a standalone landing page. 
        It bypasses default global layout colors by injecting its own background and theme handling.
      */}
      <HeroSection />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection />
      
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-center text-zinc-500">
        <p>&copy; {new Date().getFullYear()} FitAI Inc. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Twitter</a>
        </div>
      </footer>
    </main>
  );
}
