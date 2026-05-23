'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { OtpLoginForm } from './OtpLoginForm';
import { useEffect } from 'react';
import Image from 'next/image';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useUIStore();

  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAuthModalOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeAuthModal]);

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/20 bg-white/95 p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] backdrop-blur-xl md:p-8"
          >
            {/* Close button */}
            <button
              onClick={closeAuthModal}
              className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/50 bg-white/50 text-neutral-400 transition-all hover:bg-white hover:text-neutral-900 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-600/20 active:scale-95"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-neutral-50 shadow-inner">
                <Image
                  src="/logo.jpg"
                  alt="Farmers Factory Logo"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  priority
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    el.parentElement!.innerHTML = '<span class="text-3xl font-black text-primary-600">F</span>';
                  }}
                />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-neutral-900">
                Welcome to Farmers<span className="text-primary-600">Factory</span>
              </h2>
              <p className="mt-2 text-sm font-medium text-neutral-500">
                Fresh from farms to your doorstep
              </p>
            </div>

            <OtpLoginForm onSuccess={closeAuthModal} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
