'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, ArrowRight, Truck } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn, formatPrice } from '@/lib/utils';
import { CartItem } from './CartItem';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const isEmpty = useCartStore((s) => s.isEmpty());

  const [minOrder, setMinOrder] = useState(600);

  useEffect(() => {
    fetch('/api/delivery-config')
      .then((r) => r.json())
      .then((d: { min_order_amount?: number }) => { if (d.min_order_amount) setMinOrder(d.min_order_amount); })
      .catch(() => {});
  }, []);

  const FREE_DELIVERY_THRESHOLD = 199;
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 25;
  const amountToFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;
  const belowMinimum = subtotal < minOrder;

  const handleOpenChange = useCallback(
    (open: boolean) => { if (!open) closeDrawer(); },
    [closeDrawer],
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="cart-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[7000] bg-black/50 backdrop-blur-sm"
              />
            )}
          </AnimatePresence>
        </Dialog.Overlay>

        <Dialog.Content
          aria-modal="true"
          aria-label="Shopping cart"
          className={cn(
            'fixed bottom-0 left-0 right-0 z-[7001]',
            'rounded-t-[28px] bg-white shadow-2xl',
            'max-h-[88vh] flex flex-col',
            'focus:outline-none',
          )}
          onInteractOutside={closeDrawer}
          onEscapeKeyDown={closeDrawer}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="cart-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="flex flex-col max-h-[88vh]"
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-0">
                  <div className="h-1 w-12 rounded-full bg-neutral-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                  <Dialog.Title className="flex items-center gap-2 text-lg font-black text-neutral-900">
                    <ShoppingCart className="h-5 w-5 text-primary-600" />
                    My Cart
                    {!isEmpty && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                        {items.length}
                      </span>
                    )}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      aria-label="Close cart"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* 24hr delivery bar */}
                <div className="flex items-center gap-2 bg-primary-50 px-5 py-2.5">
                  <Truck className="h-4 w-4 text-primary-600" />
                  <p className="text-xs font-bold text-primary-700">
                    🚚 24hr Delivery — Farm fresh to your door
                  </p>
                </div>

                {/* Content */}
                {isEmpty ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                    <div className="rounded-full bg-neutral-100 p-6">
                      <ShoppingCart className="h-10 w-10 text-neutral-300" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-800">Your cart is empty</p>
                      <p className="mt-1 text-sm text-neutral-500">Add items to get started</p>
                    </div>
                    <Dialog.Close asChild>
                      <Link
                        href="/"
                        className="mt-2 rounded-2xl bg-primary-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
                      >
                        Shop Now
                      </Link>
                    </Dialog.Close>
                  </div>
                ) : (
                  <>
                    {/* Free delivery nudge */}
                    {amountToFreeDelivery > 0 && (
                      <div className="mx-5 mt-3 rounded-2xl bg-amber-50 p-3 border border-amber-100">
                        <p className="text-xs text-amber-700 font-semibold">
                          Add <strong>{formatPrice(amountToFreeDelivery)}</strong> more for{' '}
                          <strong>FREE delivery</strong>
                        </p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-amber-200">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <ul className="flex-1 overflow-y-auto divide-y divide-neutral-50 px-5 mt-2">
                      {items.map((item) => (
                        <li key={item.productId}>
                          <CartItem item={item} />
                        </li>
                      ))}
                    </ul>

                    {/* Footer */}
                    <div className="border-t border-neutral-100 bg-white px-5 py-4 pb-safe">
                      <div className="space-y-1.5 text-sm mb-4">
                        <div className="flex justify-between text-neutral-600">
                          <span>Subtotal</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" /> Delivery
                          </span>
                          <span className={deliveryFee === 0 ? 'font-bold text-primary-600' : ''}>
                            {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-black text-neutral-900">
                          <span>Total</span>
                          <span>{formatPrice(subtotal + deliveryFee)}</span>
                        </div>
                      </div>
                      {belowMinimum ? (
                        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                          <p className="text-sm font-bold text-amber-700">
                            Minimum order is {formatPrice(minOrder)}
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Add {formatPrice(minOrder - subtotal)} more to checkout
                          </p>
                        </div>
                      ) : (
                        <Dialog.Close asChild>
                          <Link
                            href="/checkout"
                            className={cn(
                              'flex w-full items-center justify-center gap-2',
                              'rounded-2xl bg-primary-600 py-4',
                              'text-base font-black text-white shadow-lg shadow-primary-200',
                              'transition-all active:scale-[0.98] hover:bg-primary-700',
                            )}
                          >
                            Proceed to Checkout
                            <ArrowRight className="h-5 w-5" />
                          </Link>
                        </Dialog.Close>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
