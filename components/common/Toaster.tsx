'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-[358px] flex flex-col gap-2 px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md",
              toast.variant === 'success' && "bg-green-50/90 border-green-100 text-green-900",
              toast.variant === 'error' && "bg-red-50/90 border-red-100 text-red-900",
              toast.variant === 'warning' && "bg-amber-50/90 border-amber-100 text-amber-900",
              (toast.variant === 'default' || !toast.variant) && "bg-white/90 border-neutral-100 text-neutral-900",
            )}
          >
            <div className="mt-0.5">
              {toast.variant === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {toast.variant === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {toast.variant === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {(toast.variant === 'default' || !toast.variant) && <Info className="h-5 w-5 text-primary-600" />}
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-bold leading-tight">{toast.title}</h4>
              {toast.description && (
                <p className="mt-1 text-xs font-medium opacity-80 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="mt-0.5 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
