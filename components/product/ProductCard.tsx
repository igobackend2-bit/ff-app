'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Minus, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useProductDetailStore } from '@/store/productDetailStore';
import { cn, formatPrice, discountPercent } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  // ── Hydration guard ────────────────────────────────────────────────────────
  // Both wishlist and cart live in localStorage (Zustand persist).
  // During SSR those stores are empty; after client rehydration they have real
  // values.  Reading them before mount produces mismatched aria-* attrs and
  // class names → React hydration error.  We delay until after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Falls back to the category emoji when a product image URL is broken/404
  const [imgError, setImgError] = useState(false);

  const openSheet      = useProductDetailStore((s) => s.openSheet);
  const addItem        = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems      = useCartStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlisted     = useWishlistStore((s) => s.isWishlisted(product.id));

  // Safe values — always false/0 on server, real value after mount
  const isWishlisted = mounted ? wishlisted : false;
  const cartItem     = mounted ? cartItems.find((i) => i.productId === product.id) : undefined;
  const cartQty      = cartItem?.quantity ?? 0;

  const discount   = discountPercent(product.mrp, product.price);
  const outOfStock = !product.inStock;
  const isOrganic  = product.tags?.some((t) => t.toLowerCase().includes('organic'));

  const handleOpenSheet = useCallback(() => { openSheet(product); }, [openSheet, product]);

  const handleAdd = useCallback(() => {
    if (outOfStock) return;
    addItem(product, 1);
  }, [addItem, product, outOfStock]);

  const handleIncrease = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, cartQty + 1);
  }, [updateQuantity, product.id, cartQty]);

  const handleDecrease = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, cartQty - 1);
  }, [updateQuantity, product.id, cartQty]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  }, [toggleWishlist, product]);

  const getEmoji = () => {
    const cat = (product.categorySlug ?? product.categoryName ?? '').toLowerCase();
    if (cat.includes('veg') || cat.includes('farm')) return '🥦';
    if (cat.includes('fruit')) return '🍎';
    if (cat.includes('dairy')) return '🥛';
    if (cat.includes('grain') || cat.includes('rice')) return '🌾';
    if (cat.includes('oil')) return '🫙';
    if (cat.includes('herb') || cat.includes('spice')) return '🌿';
    return '🌱';
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'bg-green-50 border border-green-100',
        'transition-all duration-200',
        outOfStock ? 'opacity-70' : 'hover:shadow-lg hover:-translate-y-0.5',
      )}
      aria-label={product.name + (outOfStock ? ' — Out of Stock' : '')}
    >
      {/* ── Image area ── */}
      <div className="relative">
        {/* Organic badge */}
        {isOrganic && !outOfStock && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-primary-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            Organic
          </span>
        )}

        {/* Wishlist button — uses safe isWishlisted so server+client match */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className={cn(
            'absolute right-2 top-2 z-10',
            'flex h-8 w-8 items-center justify-center rounded-full',
            'bg-white shadow-sm border border-neutral-100',
            'transition-transform hover:scale-110 active:scale-90',
          )}
        >
          <Heart
            className={cn(
              'h-4 w-4',
              isWishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-neutral-400',
            )}
          />
        </button>

        {/* Image — clicking opens detail sheet */}
        <button
          onClick={handleOpenSheet}
          aria-label={'View details for ' + product.name}
          className="w-full text-left"
        >
          <div
            className={cn(
              'relative h-36 w-full overflow-hidden bg-green-50 sm:h-40',
              outOfStock && 'grayscale',
            )}
          >
            {product.imageUrls[0] && !imgError ? (
              <Image
                src={product.imageUrls[0]}
                alt={product.name + ' ' + product.unit}
                fill
                sizes="(max-width:640px) 45vw,(max-width:1024px) 25vw,200px"
                className={cn(
                  'object-contain p-3 transition-transform duration-200',
                  !outOfStock && 'group-hover:scale-105',
                )}
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
                placeholder={product.blurDataUrls?.[0] ? 'blur' : 'empty'}
                blurDataURL={product.blurDataUrls?.[0] ?? undefined}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">
                {getEmoji()}
              </div>
            )}
          </div>
        </button>

        {/* Discount badge */}
        {discount > 0 && !outOfStock && (
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {discount}% off
          </span>
        )}
      </div>

      {/* ── Product info ── */}
      <div className="flex flex-1 flex-col gap-1 p-3 pt-2">
        <button
          onClick={handleOpenSheet}
          className="text-left text-sm font-bold leading-tight text-neutral-800 line-clamp-2 hover:text-primary-700"
        >
          {product.name}
        </button>

        <p className="text-[11px] font-medium text-neutral-500">{product.unit}</p>

        {/* Price + Add/Qty button */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <span className={cn('text-sm font-extrabold', outOfStock ? 'text-neutral-400' : 'text-neutral-900')}>
              {formatPrice(product.price)}
            </span>
            {discount > 0 && !outOfStock && (
              <span className="text-[10px] text-neutral-400 line-through">{formatPrice(product.mrp)}</span>
            )}
          </div>

          {/* Qty controls — only rendered after mount to avoid hydration mismatch */}
          {mounted && (
            <AnimatePresence mode="wait" initial={false}>
              {outOfStock ? (
                <motion.span
                  key="oos"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-400"
                >
                  Notify
                </motion.span>
              ) : cartQty === 0 ? (
                <motion.button
                  key="add"
                  aria-label={'Add ' + product.name + ' to cart'}
                  onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-200 hover:bg-primary-700 active:scale-90"
                >
                  <Plus className="h-5 w-5 stroke-[3]" aria-hidden="true" />
                </motion.button>
              ) : (
                <motion.div
                  key="qty"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center rounded-xl border border-primary-200 bg-white shadow-sm"
                  role="group"
                  aria-label={product.name + ' quantity ' + cartQty}
                >
                  <button
                    onClick={handleDecrease}
                    aria-label={'Remove one ' + product.name}
                    className="flex h-8 w-8 items-center justify-center rounded-l-xl text-primary-700 hover:bg-primary-50"
                  >
                    <Minus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                  </button>
                  <span
                    className="min-w-[1.25rem] text-center text-sm font-bold text-primary-700"
                    aria-live="polite"
                  >
                    {cartQty}
                  </span>
                  <button
                    onClick={handleIncrease}
                    aria-label={'Add one more ' + product.name}
                    className="flex h-8 w-8 items-center justify-center rounded-r-xl text-primary-700 hover:bg-primary-50"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* SSR placeholder — shows "+" button shape so layout doesn't shift */}
          {!mounted && !outOfStock && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-200">
              <Plus className="h-5 w-5 stroke-[3]" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
