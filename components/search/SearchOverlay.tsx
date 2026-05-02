'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SearchInterface } from './SearchInterface';
import { useUIStore } from '@/store/uiStore';
import { useEffect } from 'react';

export function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useUIStore();

  // Disable scroll when open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSearchOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeSearch]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-neutral-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mx-auto w-full max-w-screen-xl px-4 pt-12 md:px-6 lg:pt-20"
          >
            <div className="relative">
              <div 
                className="absolute inset-0 -m-4 cursor-pointer" 
                onClick={closeSearch} 
              />
              <div 
                className="relative cursor-default" 
                onClick={(e) => e.stopPropagation()}
              >
                <SearchInterface initialQuery="" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
