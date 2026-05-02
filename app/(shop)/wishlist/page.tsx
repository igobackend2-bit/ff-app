'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, discountPercent } from '@/lib/utils';
import type { Product } from '@/types';

export default function WishlistPage() {
  const items        = useWishlistStore((s) => s.items);
  const removeItem   = useWishlistStore((s) => s.removeItem);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);
  const addToCart    = useCartStore((s) => s.addItem);
  const openDrawer   = useCartStore((s) => s.openDrawer);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    openDrawer();
  };

  if (!mounted) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-8">
        <div className="h-8 w-40 rounded skeleton mb-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to shop" className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Heart className="h-5 w-5 fill-red-500 stroke-red-500" aria-hidden="true" />
              My Wishlist
            </h1>
            <p className="text-xs text-neutral-500">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <Heart className="h-10 w-10 text-red-300" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-neutral-700">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-neutral-500 max-w-xs">
            Tap the ❤️ on any product to save it here for later.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {/* Wishlist grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => {
            const discount = discountPercent(product.mrp, product.price);
            return (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card transition-shadow hover:shadow-card-hover"
              >
                {/* Remove from wishlist */}
                <button
                  onClick={() => removeItem(product.id)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Heart className="h-3.5 w-3.5 fill-red-500 stroke-red-500" aria-hidden="true" />
                </button>

                {/* Discount badge */}
                {discount > 0 && (
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-accent-700 px-2 py-0.5 text-2xs font-bold text-white">
                    {discount}% off
                  </span>
                )}

                {/* Image */}
                <Link href={`/product/${product.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600">
                  <div className="relative aspect-square overflow-hidden bg-neutral-50 p-2">
                    {product.imageUrls[0] ? (
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 45vw, 25vw"
                        className="object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-neutral-200" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col p-3">
                  {product.brandName && (
                    <p className="mb-0.5 text-2xs font-medium uppercase tracking-wider text-neutral-400">
                      {product.brandName}
                    </p>
                  )}
                  <Link href={`/product/${product.slug}`} className="text-sm font-medium leading-snug text-neutral-800 line-clamp-2 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
                    {product.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-neutral-500">{product.unit}</p>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div>
                      <span className="text-sm font-bold text-neutral-900">{formatPrice(product.price)}</span>
                      {discount > 0 && (
                        <span className="ml-1.5 text-xs text-neutral-400 line-through">{formatPrice(product.mrp)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                      aria-label={`Add ${product.name} to cart`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
