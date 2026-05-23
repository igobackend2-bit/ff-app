'use client';

import { useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { cn, formatPrice } from '@/lib/utils';
import Image from 'next/image';
import type { Product } from '@/types';

const SLIDE_VARIANTS = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

export function WishlistDrawer() {
  const isOpen = useWishlistStore((s) => s.isDrawerOpen);
  const closeDrawer = useWishlistStore((s) => s.closeDrawer);
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const addItemToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openDrawer);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeDrawer();
    },
    [closeDrawer],
  );

  const handleMoveToCart = (product: Product) => {
    addItemToCart(product);
    removeItem(product.id);
    openCart();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/40 backdrop-blur-sm"
          />
        </Dialog.Overlay>

        <Dialog.Content
          aria-modal="true"
          aria-label="Wishlist"
          className={cn(
            'fixed bottom-0 right-0 top-0 z-[7001]',
            'flex w-full max-w-sm flex-col',
            'bg-white shadow-drawer',
            'focus:outline-none',
          )}
          onInteractOutside={closeDrawer}
          onEscapeKeyDown={closeDrawer}
        >
          <AnimatePresence>
            <motion.div
              variants={SLIDE_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex h-full flex-col"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4">
                <Dialog.Title className="flex items-center gap-2 text-base font-bold text-neutral-900">
                  <Heart className="h-5 w-5 text-danger-500 fill-danger-500" aria-hidden="true" />
                  My Wishlist
                  {items.length > 0 && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                      {items.length}
                    </span>
                  )}
                </Dialog.Title>

                <Dialog.Close asChild>
                  <button
                    aria-label="Close wishlist"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 rounded-full bg-neutral-100 p-6">
                      <Heart className="h-10 w-10 text-neutral-300" aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-neutral-800">Your wishlist is empty</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Save items you like for later
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-50 px-4">
                    {items.map((product) => (
                      <li key={product.id} className="flex items-center gap-3 py-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                          {product.imageUrls[0] && (
                            <Image
                              src={product.imageUrls[0]}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <p className="line-clamp-2 text-sm font-medium text-neutral-800">
                            {product.name}
                          </p>
                          <p className="text-xs text-neutral-500">{product.unit}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-sm font-bold text-neutral-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.mrp > product.price && (
                              <span className="text-xs text-neutral-400 line-through">
                                {formatPrice(product.mrp)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleMoveToCart(product)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors hover:bg-primary-100"
                            aria-label="Add to cart"
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-danger-500"
                            aria-label="Remove from wishlist"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-neutral-100 p-4">
                  <button
                    onClick={() => {
                      items.forEach((p) => addItemToCart(p));
                      useWishlistStore.getState().clearWishlist();
                      openCart();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 active:scale-[0.98]"
                  >
                    Add All to Cart
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
