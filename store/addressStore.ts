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
  setAddress: (a: SavedAddress) => void;
  clearAddress: () => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      address: null,
      setAddress: (address) => set({ address }),
      clearAddress: () => set({ address: null }),
    }),
    {
      name: 'ff-delivery-address',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as unknown as Storage),
      ),
    },
  ),
);
