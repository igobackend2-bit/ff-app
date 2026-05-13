'use client';

import { useState } from 'react';
import { Plus, Minus, ShoppingCart, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn, formatPrice, calculateEffectivePrice } from '@/lib/utils';
import type { Product } from '@/types';

export function AddToCartSection({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [weight, setWeight] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  const handleAdd = () => {
    // We pass weight as part of metadata or adjust price
    // Usually cart store would handle this.
    addItem(product, qty, { weight });
    openDrawer();
  };

  const totalPrice = calculateEffectivePrice(product.price, product.unit, weight) * qty;

  return (
    <div className="mt-6 space-y-6">
      {/* Weight Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-neutral-900">Select Weight</label>
          <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-bold text-primary-700">
            {weight} kg
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          step="0.5"
          value={weight}
          onChange={(e) => setWeight(parseFloat(e.target.value))}
          className="h-2 w-100% cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-primary-600"
        />
        <div className="flex justify-between text-[10px] font-medium text-neutral-400">
          <span>1 KG</span>
          <span>15 KG</span>
          <span>30 KG</span>
        </div>
      </div>

      {/* Delivery ETA */}
      <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-2.5">
        <Zap className="h-4 w-4 text-primary-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-primary-700">Delivery within 24 hours 🚚</p>
      </div>

      {/* Quantity + Add */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center rounded-xl border border-neutral-200"
          role="group"
          aria-label="Quantity"
        >
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            className="flex h-12 w-12 items-center justify-center rounded-l-xl text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span
            className="min-w-[2.5rem] text-center text-base font-bold text-neutral-900"
            aria-live="polite"
          >
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="flex h-12 w-12 items-center justify-center rounded-r-xl text-neutral-600 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={!product.inStock}
          aria-label={`Add ${qty} ${product.name} ${weight}kg to cart`}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-3',
            'text-sm font-bold text-white transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
            product.inStock
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'cursor-not-allowed bg-neutral-200 text-neutral-400',
          )}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {product.inStock
            ? `Add to Cart · ${formatPrice(totalPrice)}`
            : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
