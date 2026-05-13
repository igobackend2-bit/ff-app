// Wishlist Store — user-isolated: clears when a different user logs in
'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
  userId: string | null;
  isDrawerOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
  initForUser: (uid: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      isDrawerOpen: false,

      initForUser: (uid) => {
        if (get().userId && get().userId !== uid) {
          set({ items: [], userId: uid });
        } else {
          set({ userId: uid });
        }
      },

      addItem: (product) => {
        set((state) => {
          if (state.items.find((i) => i.id === product.id)) return state;
          return { items: [...state.items, product] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== productId) }));
      },

      toggleItem: (product) => {
        const isIn = get().items.some((i) => i.id === product.id);
        if (isIn) get().removeItem(product.id);
        else get().addItem(product);
      },

      isWishlisted: (productId) => get().items.some((i) => i.id === productId),

      clearWishlist: () => set({ items: [], userId: null }),

      openDrawer:   () => set({ isDrawerOpen: true  }),
      closeDrawer:  () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
      count:        () => get().items.length,
    }),
    {
      name: 'ff-wishlist',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as unknown as Storage),
      ),
      partialize: (state) => ({ items: state.items, userId: state.userId }),
    },
  ),
);
