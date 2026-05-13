// Cart Store (Skill #6 — Zustand with persistence, Skill #49 — state before UI)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateEffectivePrice } from '@/lib/utils';
import type { CartItem, Product } from '@/types';

interface CartState {
  // State
  items: CartItem[];
  isDrawerOpen: boolean;

  // Actions
  addItem: (product: Product, quantity?: number, options?: { weight?: number }) => void;
  removeItem: (productId: string, weight?: number) => void;
  updateQuantity: (productId: string, quantity: number, weight?: number) => void;
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

      addItem: (product, quantity = 1, options = {}) => {
        const weight = options.weight || 1;
        set((state) => {
          // Identify unique item by ID AND weight
          const existing = state.items.find(
            (i) => i.productId === product.id && i.weight === weight
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id && i.weight === weight
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { productId: product.id, product, quantity, weight },
            ],
          };
        });
      },

      removeItem: (productId, weight = 1) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && (i.weight === weight || !i.weight && weight === 1))
          ),
        }));
      },

      updateQuantity: (productId, quantity, weight = 1) => {
        if (quantity <= 0) {
          get().removeItem(productId, weight);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && (i.weight === weight || !i.weight && weight === 1) ? { ...i, quantity } : i,
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
        get().items.reduce(
          (sum, i) =>
            sum + calculateEffectivePrice(i.product.price, i.product.unit, i.weight) * i.quantity,
          0,
        ),

      totalSavings: () =>
        get().items.reduce((sum, i) => {
          const savingsPerUnit = i.product.mrp - i.product.price;
          const effectiveSavings = calculateEffectivePrice(savingsPerUnit, i.product.unit, i.weight);
          return sum + effectiveSavings * i.quantity;
        }, 0),

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
