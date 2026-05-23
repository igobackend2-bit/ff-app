// User Store — extended with logout, updateProfile helpers
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

export interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
  updateProfile: (partial: Partial<User>) => Promise<void>;
  isLoggedIn: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
      logout: () => set({ user: null }),
      updateProfile: async (partial: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        }));
      },
      isLoggedIn: () => get().user !== null,
    }),
    {
      name: 'ff-user',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as unknown as Storage),
      ),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
