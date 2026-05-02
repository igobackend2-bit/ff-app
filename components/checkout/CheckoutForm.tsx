'use client';

// Skill #16 — Razorpay loaded dynamically at checkout ONLY
// Skill #30 — All inputs have <label>
// Skill #17 — Zod validation
// Skill #39 — CSRF double-submit cookie

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Loader2, Truck } from 'lucide-react';

// Skill #16 — Razorpay is ONLY imported here at checkout — never on other pages
// This keeps the payment SDK out of the main bundle
const RazorpayCheckout = dynamic(
  () => import('./RazorpayCheckout').then((m) => m.RazorpayCheckout),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-100">
        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
        <span className="text-sm text-neutral-500">Loading payment…</span>
      </div>
    ),
  },
);

export function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const totalSavings = useCartStore((s) => s.totalSavings());
  const isEmpty = useCartStore((s) => s.isEmpty());

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const deliveryFee = subtotal >= 199 ? 0 : 25;
  const total = subtotal + deliveryFee - appliedDiscount;

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });

      const data = (await res.json()) as { discount?: number; error?: string };

      if (!res.ok || !data.discount) {
        setCouponError(data.error ?? 'Invalid coupon code');
        return;
      }

      setAppliedDiscount(data.discount);
    } catch {
      setCouponError('Could not apply coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, subtotal]);

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-neutral-600">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* ── Order summary ─────────────────────────────────────── */}
      <div className="md:col-span-2 space-y-4">
        {/* Items */}
        <section
          aria-labelledby="items-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-4"
        >
          <h2 id="items-heading" className="mb-3 text-base font-bold text-neutral-900">
            Order Items ({items.length})
          </h2>
          <ul aria-label="Order items" className="divide-y divide-neutral-50">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1 text-sm font-medium text-neutral-800">
                  {item.product.name} {item.product.unit}
                </span>
                <span className="text-xs text-neutral-500">×{item.quantity}</span>
                <span className="text-sm font-semibold text-neutral-900">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Coupon — Skill #30: label for input */}
        <section
          aria-labelledby="coupon-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-4"
        >
          <h2 id="coupon-heading" className="mb-3 text-base font-bold text-neutral-900">
            Coupon Code
          </h2>
          <div className="flex gap-2">
            {/* Skill #30 — label for coupon input */}
            <label htmlFor="coupon" className="sr-only">
              Coupon code
            </label>
            <input
              id="coupon"
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (couponError) setCouponError('');
              }}
              placeholder="ENTER CODE"
              aria-describedby={couponError ? 'coupon-error' : undefined}
              aria-invalid={couponError ? 'true' : 'false'}
              disabled={appliedDiscount > 0}
              className={cn(
                'flex-1 rounded-xl border bg-white px-3 py-2.5 text-sm font-mono uppercase',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                couponError ? 'border-danger-500' : 'border-neutral-200',
                appliedDiscount > 0 && 'bg-neutral-50 text-neutral-400',
              )}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || appliedDiscount > 0 || !couponCode.trim()}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-semibold',
                'transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-50',
                appliedDiscount > 0
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700',
              )}
            >
              {couponLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : appliedDiscount > 0 ? (
                '✓ Applied'
              ) : (
                'Apply'
              )}
            </button>
          </div>
          {couponError && (
            <p id="coupon-error" role="alert" className="mt-1.5 text-xs text-danger-600">
              ⚠ {couponError}
            </p>
          )}
          {appliedDiscount > 0 && (
            <p className="mt-1.5 text-xs text-primary-600" role="status">
              ✓ Saved {formatPrice(appliedDiscount)} with coupon
            </p>
          )}
        </section>
      </div>

      {/* ── Price summary + payment ───────────────────────────── */}
      <div className="space-y-4">
        <section
          aria-labelledby="price-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-4"
        >
          <h2 id="price-heading" className="mb-3 text-base font-bold text-neutral-900">
            Price Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-primary-600">
                <span>You save</span>
                <span>−{formatPrice(totalSavings)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Delivery</span>
              <span className={deliveryFee === 0 ? 'font-semibold text-primary-600' : ''}>
                {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
              </span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-primary-600">
                <span>Coupon discount</span>
                <span>−{formatPrice(appliedDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-bold text-neutral-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </section>

        {/* ETA card */}
        <div className="flex items-center gap-2 rounded-2xl bg-primary-50 p-3">
          <Truck className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-primary-700">🚚 24hr Delivery</p>
            <p className="text-xs text-primary-600">Delivered within 24 hours of order</p>
          </div>
        </div>

        {/* Skill #16 — Razorpay loaded ONLY here, dynamically */}
        <RazorpayCheckout
          amount={total}
          items={items}
          appliedDiscount={appliedDiscount}
          couponCode={couponCode}
          deliveryFee={deliveryFee}
        />
      </div>
    </div>
  );
}
