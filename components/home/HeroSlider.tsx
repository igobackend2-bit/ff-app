'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    id: 1,
    badge: '🌾 Farmers Factory',
    headline: 'Farm-to-Door\nFreshness',
    sub: 'Organic vegetables, grains & dairy direct from Karnataka farms',
    cta: 'Shop Farm Fresh',
    href: '/category/farm-fresh',
    bg: 'from-emerald-700 via-green-600 to-teal-600',
    accent: 'bg-yellow-400 text-yellow-900',
    emoji: '🥦',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)',
  },
  {
    id: 2,
    badge: '🪔 Valluvam Products',
    headline: 'Traditional\nTaste of Tamil Nadu',
    sub: 'Cold-pressed oils, country sugar, traditional rice varieties & pickles',
    cta: 'Shop Traditional',
    href: '/category/traditional',
    bg: 'from-orange-600 via-amber-600 to-yellow-600',
    accent: 'bg-white text-orange-700',
    emoji: '🫙',
    pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%)',
  },
  {
    id: 3,
    badge: '⚡ 24-Hour Delivery',
    headline: 'Order Today\nGet Tomorrow',
    sub: 'Fresh produce harvested daily, delivered to your door within 24 hours',
    cta: 'Order Now',
    href: '/',
    bg: 'from-blue-700 via-indigo-600 to-violet-700',
    accent: 'bg-green-400 text-green-900',
    emoji: '🚚',
    pattern: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 60%)',
  },
  {
    id: 4,
    badge: '🌿 100% Natural',
    headline: 'No Chemicals\nNo Compromise',
    sub: 'Certified organic products — good for your family, good for the earth',
    cta: 'Explore Organic',
    href: '/category/organic',
    bg: 'from-lime-700 via-green-700 to-emerald-800',
    accent: 'bg-orange-400 text-orange-900',
    emoji: '🌱',
    pattern: 'radial-gradient(circle at 90% 90%, rgba(255,255,255,0.1) 0%, transparent 50%)',
  },
];

const SLIDE_INTERVAL = 4500;

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const next = useCallback(() => {
    setDirection('next');
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection('prev');
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setDirection(i > current ? 'next' : 'prev');
    setCurrent(i);
  }, [current]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPlaying, next]);

  const variants = {
    enter: (dir: string) => ({ x: dir === 'next' ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: string) => ({ x: dir === 'next' ? '-100%' : '100%', opacity: 0 }),
  };

  const slide = SLIDES[current]!;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      role="region"
      aria-label="Featured promotions slider"
      aria-roledescription="carousel"
    >
      <div className="relative h-48 sm:h-56 md:h-64">
        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'absolute inset-0 flex flex-col justify-center overflow-hidden',
              `bg-gradient-to-br ${slide.bg}`,
            )}
            aria-roledescription="slide"
            aria-label={`Slide ${current + 1} of ${SLIDES.length}: ${slide.headline.replace('\n', ' ')}`}
          >
            {/* Radial pattern overlay — separate from gradient so SSR renders correctly */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: slide.pattern }} aria-hidden="true" />
            {/* Decorative blobs */}
            <motion.div
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-6 right-24 h-24 w-24 rounded-full bg-white/10"
              animate={{ scale: [1.1, 1, 1.1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Content */}
            <div className="relative z-10 px-6 py-5">
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  'inline-block rounded-full px-3 py-1 text-xs font-bold',
                  slide.accent,
                )}
              >
                {slide.badge}
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl"
                style={{ whiteSpace: 'pre-line' }}
              >
                {slide.headline}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-1.5 max-w-xs text-xs text-white/80 sm:text-sm"
              >
                {slide.sub}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3"
              >
                <Link
                  href={slide.href}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2',
                    'text-sm font-bold transition-opacity hover:opacity-90',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    slide.accent,
                  )}
                >
                  {slide.cta} →
                </Link>
              </motion.div>
            </div>

            {/* Big emoji */}
            <motion.div
              className="absolute bottom-2 right-6 text-5xl select-none sm:text-6xl"
              animate={{ y: [0, -6, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              {slide.emoji}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {/* Dot indicators */}
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-pressed={i === current}
            className={cn(
              'rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
              i === current ? 'h-2 w-6 bg-white' : 'h-2 w-2 bg-white/50 hover:bg-white/80',
            )}
          />
        ))}
      </div>

      {/* Prev / Next */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Skill #32 — Pause/play for cycling animation */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        aria-pressed={!isPlaying}
        className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
    </div>
  );
}
