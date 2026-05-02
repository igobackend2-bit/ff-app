'use client';

import Image from 'next/image';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn, formatPrice } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const { product, quantity } = item;

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Product image */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
        {product.imageUrls[0] && (
          <Image
            src={product.imageUrls[0]}
            // Skill #8: alt = product name + unit
            alt={`${product.name} ${product.unit}`}
            fill
            sizes="56px"
            className="object-contain p-1"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-neutral-800">
          {product.name}
        </p>
        <p className="text-xs text-neutral-500">{product.unit}</p>
        <p className="text-sm font-bold text-neutral-900">
          {formatPrice(product.price * quantity)}
        </p>
      </div>

      {/* Quantity controls */}
      <div
        className="flex items-center rounded-lg border border-primary-200 bg-primary-50"
        role="group"
        aria-label={`${product.name} quantity`}
      >
        <button
          onClick={() => updateQuantity(product.id, quantity - 1)}
          aria-label={
            quantity === 1
              ? `Remove ${product.name} from cart`
              : `Decrease ${product.name} quantity`
          }
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-l-lg',
            'text-primary-700 transition-colors hover:bg-primary-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
          )}
        >
          {quantity === 1 ? (
            <Trash2 className="h-3.5 w-3.5 text-danger-600" aria-hidden="true" />
          ) : (
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>

        <span
          className="min-w-[1.75rem] text-center text-sm font-bold text-primary-700"
          aria-live="polite"
          aria-atomic="true"
        >
          {quantity}
        </span>

        <button
          onClick={() => updateQuantity(product.id, quantity + 1)}
          aria-label={`Increase ${product.name} quantity`}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-r-lg',
            'text-primary-700 transition-colors hover:bg-primary-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
          )}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
