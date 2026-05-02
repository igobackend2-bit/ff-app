'use client';

import { motion } from 'framer-motion';

const ITEMS = [
  '🚚 24hr DELIVERY',
  '🌱 100% ORGANIC',
  '🌾 STRAIGHT FROM FARMS',
  '🥦 FRESH DAILY HARVEST',
  '🫙 TRADITIONAL PRODUCTS',
  '🍎 ZERO CHEMICALS',
  '🚚 24hr DELIVERY',
  '🌱 100% ORGANIC',
  '🌾 STRAIGHT FROM FARMS',
  '🥦 FRESH DAILY HARVEST',
  '🫙 TRADITIONAL PRODUCTS',
  '🍎 ZERO CHEMICALS',
];

export function DeliveryStrip() {
  return (
    <div
      className="w-full overflow-hidden bg-primary-600 py-2"
      aria-label="24 hour delivery available"
    >
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="flex gap-0 whitespace-nowrap"
      >
        {ITEMS.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-6 text-xs font-black uppercase tracking-widest text-white"
          >
            {item}
            <span className="text-white/40">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
