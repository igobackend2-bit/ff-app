// UI Store (Skill #6) — toasts, modals, loading states
import { create } from 'zustand';
import type { Toast } from '@/types';

interface UIState {
  toasts: Toast[];
  isAuthModalOpen: boolean;
  authModalCallbackUrl: string | null;
  isSearchOpen: boolean;
  isLocationModalOpen: boolean;
  isInstallPromptVisible: boolean;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modal actions
  openAuthModal: (callbackUrl?: string) => void;
  closeAuthModal: () => void;

  openLocationModal: () => void;
  closeLocationModal: () => void;

  // Search
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;

  // PWA install prompt
  showInstallPrompt: () => void;
  dismissInstallPrompt: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  toasts: [],
  isAuthModalOpen: false,
  authModalCallbackUrl: null,
  isSearchOpen: false,
  isLocationModalOpen: false,
  isInstallPromptVisible: false,

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    const duration = toast.duration ?? 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),

  openAuthModal: (callbackUrl) =>
    set({ isAuthModalOpen: true, authModalCallbackUrl: callbackUrl ?? null }),

  closeAuthModal: () =>
    set({ isAuthModalOpen: false, authModalCallbackUrl: null }),

  openLocationModal: () => set({ isLocationModalOpen: true }),
  closeLocationModal: () => set({ isLocationModalOpen: false }),

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),

  showInstallPrompt: () => set({ isInstallPromptVisible: true }),
  dismissInstallPrompt: () => set({ isInstallPromptVisible: false }),
}));
