'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingCart, ArrowLeft, Trash2, PackageOpen } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export default function WishlistPage() {
  const router   = useRouter();
  const user     = useUserStore((s) => s.user);
  const items    = useWishlistStore((s) => s.items);
  const remove   = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useUserStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace('/login?callbackUrl=/account/wishlist');
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-[#F2F3F7] animate-pulse">
        <div className="mx-auto max-w-screen-md px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F3F7] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-screen-md items-center gap-3">
          <Link
            href="/account"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <h1 className="text-lg font-black text-neutral-900">My Wishlist</h1>
            {items.length > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
                {items.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-5">
        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
              <PackageOpen className="h-10 w-10 text-neutral-300" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-700">Your wishlist is empty</p>
              <p className="mt-1 text-sm text-neutral-400">
                Tap the heart icon on any product to save it here
              </p>
            </div>
            <Link
              href="/"
              className="rounded-2xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((product: Product) => (
              <WishlistCard
                key={product.id}
                product={product}
                onRemove={() => remove(product.id)}
                onAddToCart={() => {
                  addToCart(product, 1);
                  remove(product.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WishlistCard({
  product,
  onRemove,
  onAddToCart,
}: {
  product: Product;
  onRemove: () => void;
  onAddToCart: () => void;
}) {
  const imageUrl = product.imageUrls?.[0] ?? '/placeholder-product.jpg';
  const discount = product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : 0;

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.jpg'; }}
        />
        {discount > 0 && (
          <span className="absolute left-1 top-1 rounded-md bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-neutral-900">{product.name}</p>
        <p className="text-xs text-neutral-400">{product.unit}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-black text-neutral-900">₹{product.price}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-neutral-400 line-through">₹{product.mrp}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onAddToCart}
          className={cn(
            'flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2',
            'text-xs font-bold text-white hover:bg-primary-700 transition-colors',
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add
        </button>
        <button
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
