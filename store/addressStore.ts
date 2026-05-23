'use client';
// Persists the user's saved delivery address across sessions
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SavedAddress {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  label?: string; // "Home", "Work", etc.
}

interface AddressState {
  address: SavedAddress | null;
  userId: string | null;
  setAddress: (a: SavedAddress) => void;
  clearAddress: () => void;
  // Call on login — clears stored address if a different user was logged in
  initForUser: (uid: string) => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      address: null,
      userId: null,
      setAddress: (address) => set({ address }),
      clearAddress: () => set({ address: null, userId: null }),
      initForUser: (uid) => {
        if (get().userId && get().userId !== uid) {
          // Different user — wipe the previous user's address
          set({ address: null, userId: uid });
        } else {
          set({ userId: uid });
        }
      },
    }),
    {
      name: 'ff-delivery-address',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as unknown as Storage),
      ),
      partialize: (state) => ({ address: state.address, userId: state.userId }),
    },
  ),
);
