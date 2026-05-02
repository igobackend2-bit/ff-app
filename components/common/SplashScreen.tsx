'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Truck, Leaf, ShoppingBag } from 'lucide-react';

const SPLASH_KEY = 'qc-splash-shown';

export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show splash once per session
    if (typeof window !== 'undefined' && !sessionStorage.getItem(SPLASH_KEY)) {
      setShow(true);
      sessionStorage.setItem(SPLASH_KEY, '1');

      // Auto-advance steps
      const t1 = setTimeout(() => setStep(1), 600);
      const t2 = setTimeout(() => setStep(2), 1400);
      const t3 = setTimeout(() => setStep(3), 2100);
      const t4 = setTimeout(() => setShow(false), 3000);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
    return undefined;
  }, []);

  const icons = [
    { Icon: Leaf, label: 'Farm Fresh', color: 'text-green-400' },
    { Icon: ShoppingBag, label: 'Quality Products', color: 'text-yellow-400' },
    { Icon: Truck, label: '24hr Delivery', color: 'text-blue-400' },
  ];

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-700 via-primary-600 to-green-500"
          role="status"
          aria-label="Loading Farmers Factory"
        >
          {/* Background circles */}
          <motion.div
            className="absolute h-[500px] w-[500px] rounded-full bg-white/5"
            animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 180] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute h-[300px] w-[300px] rounded-full bg-white/5"
            animate={{ scale: [1.15, 1, 1.15], rotate: [180, 90, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative z-10 mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-2xl p-2"
          >
            <img src="/logo.jpg" alt="Farmers Factory logo" className="h-full w-full object-contain" />
          </motion.div>

          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative z-10 text-center"
          >
            <h1 className="text-4xl font-black tracking-tight text-white">
              Farmers <span className="text-yellow-300">Factory</span>
            </h1>
            <p className="mt-1 text-base font-medium text-white/80">
              Farm Fresh · Delivered in 24 hrs
            </p>
          </motion.div>

          {/* Feature pills */}
          <div className="relative z-10 mt-8 flex gap-4">
            {icons.map(({ Icon, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: step > i ? 1 : 0, y: step > i ? 0 : 20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <span className="text-xs font-semibold text-white/90">{label}</span>
              </motion.div>
            ))}
          </div>

          {/* Loading bar */}
          <motion.div className="relative z-10 mt-10 h-1 w-48 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full bg-yellow-300"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
