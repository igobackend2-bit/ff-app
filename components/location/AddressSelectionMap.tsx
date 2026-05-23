'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Check, ChevronRight, LocateFixed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationStore } from '@/store/locationStore';

export function AddressSelectionMap() {
  const { address: storedAddress, isLocating, detectLocation } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const currentAddress = storedAddress || '';

  const handleDetect = useCallback(async () => {
    await detectLocation();
  }, [detectLocation]);

  const handleConfirm = useCallback(() => {
    setIsConfirming(true);
    setTimeout(() => setIsConfirming(false), 1500);
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-neutral-100">
      {/* Header / Search Overlay */}
      <div className="absolute left-0 right-0 top-0 z-30 p-4 pt-12 md:pt-4">
        <div className="mx-auto max-w-lg">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search for area, street name..."
              className="w-full rounded-2xl border-none bg-white/90 py-4 pl-12 pr-4 font-medium shadow-2xl shadow-black/5 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Map Background */}
      <div className="relative flex-1 bg-neutral-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative mb-12">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="relative z-10"
            >
              <div className="rounded-full bg-primary-600 p-3 shadow-2xl shadow-primary-500/50">
                <MapPin className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <div className="absolute -bottom-2 left-1/2 h-2 w-4 -translate-x-1/2 rounded-full bg-black/10 blur-sm" />
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="z-20 rounded-t-[40px] bg-white p-8 pb-12 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={handleDetect}
              disabled={isLocating}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-transform hover:scale-95 active:scale-90"
            >
              <LocateFixed className={cn('h-6 w-6', isLocating && 'animate-spin')} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Current Location
              </p>
              <h2 className="truncate text-lg font-black leading-tight text-neutral-900">
                {isLocating ? 'Fetching...' : currentAddress || 'Select delivery location'}
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleConfirm}
              disabled={isConfirming || isLocating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-lg font-black text-white shadow-xl shadow-neutral-200 transition-transform active:scale-95"
            >
              {isConfirming ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Processing...
                </>
              ) : (
                <>Confirm Location <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
            <button className="w-full py-2 text-center text-sm font-bold text-neutral-400">
              Enter Address Manually
            </button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isConfirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-primary-600 text-white"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-lg">
                <Check className="h-12 w-12" />
              </div>
              <h3 className="mb-2 text-3xl font-black">Location Saved!</h3>
              <p className="text-sm font-medium uppercase tracking-widest text-white/80">
                Finding nearest store...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
