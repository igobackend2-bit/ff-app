'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, Check, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useLocationStore } from '@/store/locationStore';
import { cn } from '@/lib/utils';

const CHENNAI_AREAS = [
  { name: 'Anna Nagar', pincode: '600040' },
  { name: 'T. Nagar', pincode: '600017' },
  { name: 'Velachery', pincode: '600042' },
  { name: 'Adyar', pincode: '600020' },
  { name: 'Porur', pincode: '600116' },
  { name: 'Tambaram', pincode: '600045' },
  { name: 'Sholinganallur', pincode: '600119' },
  { name: 'OMR', pincode: '600097' },
  { name: 'Perambur', pincode: '600011' },
  { name: 'Mylapore', pincode: '600004' },
  { name: 'Besant Nagar', pincode: '600090' },
  { name: 'Nungambakkam', pincode: '600034' },
  { name: 'Thiruvanmiyur', pincode: '600041' },
  { name: 'Chromepet', pincode: '600044' },
];

export function LocationModal() {
  const { isLocationModalOpen, closeLocationModal } = useUIStore();
  const { address, setLocation, detectLocation, isLocating } = useLocationStore();
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const handleAreaSelect = useCallback((area: { name: string; pincode: string }) => {
    setLocation({
      lat: 13.0827, // Approx Chennai center
      lng: 80.2707,
      address: `${area.name}, Chennai`,
      pincode: area.pincode,
      city: 'Chennai',
    });
    closeLocationModal();
  }, [setLocation, closeLocationModal]);

  const handleDetectLocation = useCallback(async () => {
    await detectLocation();
    closeLocationModal();
  }, [detectLocation, closeLocationModal]);

  return (
    <AnimatePresence>
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLocationModal}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Delivery Location</h2>
                  <p className="text-xs text-neutral-500">Pick your area in Chennai or use GPS</p>
                </div>
              </div>
              <button
                onClick={closeLocationModal}
                className="rounded-full p-2 transition-colors hover:bg-neutral-100"
              >
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>

            <div className="p-6">
              {/* GPS Button */}
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className={cn(
                  'group relative mb-6 flex w-full items-center justify-between overflow-hidden rounded-2xl border-2 border-primary-100 bg-primary-50/50 p-4 transition-all hover:bg-primary-50',
                  isLocating && 'animate-pulse'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-primary-100 group-hover:scale-110 transition-transform">
                    <Navigation className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-primary-900">Detect My Location</h3>
                    <p className="text-sm text-primary-700/70">Using GPS for precise address</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary-400" />
              </button>

              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-neutral-100" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Popular Chennai Areas</span>
                <div className="h-px flex-1 bg-neutral-100" />
              </div>

              {/* Area Grid */}
              <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {CHENNAI_AREAS.map((area) => (
                  <button
                    key={area.name}
                    onClick={() => handleAreaSelect(area)}
                    onMouseEnter={() => setHoveredArea(area.name)}
                    onMouseLeave={() => setHoveredArea(null)}
                    className={cn(
                      'group flex items-center justify-between rounded-xl border p-3 text-left transition-all duration-200',
                      address?.includes(area.name)
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                        : 'border-neutral-100 hover:border-primary-200 hover:bg-neutral-50'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        'truncate text-sm font-semibold',
                        address?.includes(area.name) ? 'text-primary-700' : 'text-neutral-700'
                      )}>
                        {area.name}
                      </p>
                      <p className="text-[10px] text-neutral-400">{area.pincode}</p>
                    </div>
                    {address?.includes(area.name) ? (
                      <Check className="h-4 w-4 shrink-0 text-primary-600" />
                    ) : hoveredArea === area.name ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-primary-400" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer info */}
            <div className="bg-neutral-50 px-6 py-4">
              <p className="text-center text-[11px] leading-relaxed text-neutral-500">
                🚚 All Chennai areas receive <span className="font-bold text-primary-600">24-hour delivery</span> — farm fresh, ordered today, at your door tomorrow.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
