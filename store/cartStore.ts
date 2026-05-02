// Cart Store (Skill #6 — Zustand with persistence, Skill #49 — state before UI)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  // State
  items: CartItem[];
  isDrawerOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  // Sync with server (called after login)
  syncWithServer: () => Promise<void>;

  // Computed (derived values as methods for reactivity)
  totalItems: () => number;
  subtotal: () => number;
  totalSavings: () => number;
  isEmpty: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { productId: product.id, product, quantity },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),

      syncWithServer: async () => {
        const { items } = get();
        if (items.length === 0) return;

        try {
          await fetch('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            }),
          });
        } catch {
          // Sync failure is non-fatal — cart still works locally
          console.warn('Cart sync failed');
        }
      },

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      totalSavings: () =>
        get().items.reduce(
          (sum, i) => sum + (i.product.mrp - i.product.price) * i.quantity,
          0,
        ),

      isEmpty: () => get().items.length === 0,
    }),
    {
      name: 'ff-cart', // localStorage key
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as unknown as Storage),
      ),
      // Only persist items — not UI state
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
