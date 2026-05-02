'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { OtpLoginForm } from './OtpLoginForm';
import { useEffect } from 'react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useUIStore();

  // Disable scroll when open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAuthModalOpen]);

  // Close on Escape key
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
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl shadow-neutral-900/10 md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={closeAuthModal}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                <span className="text-3xl">🧺</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">Welcome Back</h2>
              <p className="mt-2 text-neutral-500">
                Sign in to manage orders, tracks and more
              </p>
            </div>

            <OtpLoginForm />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
