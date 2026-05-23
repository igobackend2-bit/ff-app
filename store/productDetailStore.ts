import { create } from 'zustand';
import type { Product } from '@/types';

interface ProductDetailState {
  isOpen: boolean;
  product: Product | null;
  openSheet: (product: Product) => void;
  closeSheet: () => void;
}

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  isOpen: false,
  product: null,
  openSheet: (product) => set({ isOpen: true, product }),
  closeSheet: () => set({ isOpen: false, product: null }),
}));
