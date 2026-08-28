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
  initForUser: (uid: string) => void | Promise<void>;
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

      // Account-bound: on login, push any pending local items to the server,
      // then replace the local list with this account's server wishlist so it
      // follows the user across devices / reinstalls / a cleared localStorage.
      initForUser: async (uid) => {
        const switching = get().userId != null && get().userId !== uid;
        const pending   = switching ? [] : get().items;
        set({ userId: uid, items: switching ? [] : get().items });
        if (!uid) return;

        try {
          // 1. Upload items collected before this login (best effort)
          await Promise.all(
            pending.map((p) =>
              fetch('/api/wishlist', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
                body:    JSON.stringify({ productId: p.id }),
              }).catch(() => {}),
            ),
          );

          // 2. Pull the authoritative server list
          const res = await fetch('/api/wishlist', { headers: { 'x-user-id': uid } });
          if (!res.ok) return;
          const { data } = await res.json() as { data: Array<Record<string, unknown>> };
          if (!Array.isArray(data)) return;

          const serverItems: Product[] = data
            .map((row) => {
              const p = (row['products'] ?? row) as Record<string, unknown>;
              if (!p || !p['id']) return null;
              return {
                id:          String(p['id']),
                name:        String(p['name'] ?? ''),
                slug:        String(p['slug'] ?? p['id']),
                price:       Number(p['price'] ?? 0),
                mrp:         Number(p['mrp'] ?? p['price'] ?? 0),
                unit:        String(p['unit'] ?? 'kg'),
                imageUrls:   Array.isArray(p['image_urls']) ? (p['image_urls'] as string[]) : [],
                inStock:     p['in_stock'] !== false,
              } as unknown as Product;
            })
            .filter((x): x is Product => x != null);

          // Merge: server list is source of truth, keep richer local copies by id
          const byId = new Map(get().items.map((i) => [i.id, i]));
          set({ items: serverItems.map((s) => byId.get(s.id) ?? s) });
        } catch { /* offline — keep local list */ }
      },

      addItem: (product) => {
        set((state) => {
          if (state.items.find((i) => i.id === product.id)) return state;
          return { items: [...state.items, product] };
        });
        const uid = get().userId;
        if (uid) {
          fetch('/api/wishlist', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
            body:    JSON.stringify({ productId: product.id }),
          }).catch(() => {});
        }
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== productId) }));
        const uid = get().userId;
        if (uid) {
          fetch('/api/wishlist', {
            method:  'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
            body:    JSON.stringify({ productId }),
          }).catch(() => {});
        }
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
