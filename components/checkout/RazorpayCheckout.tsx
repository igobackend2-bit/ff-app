'use client';

// Skill #16 — Razorpay integration loaded only on checkout page
// Skill #39 — CSRF via double-submit cookie pattern

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Loader2, Lock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

// Razorpay types (minimal)
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutProps {
  amount: number;
  items: CartItem[];
  appliedDiscount: number;
  couponCode: string;
  deliveryFee: number;
}

export function RazorpayCheckout({
  amount,
  items,
  appliedDiscount,
  couponCode,
  deliveryFee,
}: RazorpayCheckoutProps) {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const addToast = useUIStore((s) => s.addToast);

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = useCallback(async () => {
    if (!isScriptLoaded || !window.Razorpay) {
      addToast({ title: 'Payment not ready. Please wait.', variant: 'error' });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create server-side Razorpay order (CSRF-protected)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Includes cookies for CSRF check
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          couponCode: couponCode || undefined,
        }),
      });

      const orderData = (await orderRes.json()) as {
        razorpayOrderId?: string;
        orderId?: string;
        error?: string;
      };

      if (!orderRes.ok || !orderData.razorpayOrderId) {
        throw new Error(orderData.error ?? 'Failed to create order');
      }

      // Step 2: Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: process.env['NEXT_PUBLIC_RAZORPAY_KEY_ID'] ?? '',
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'Farmers Factory',
        description: '24-Hour Farm-Fresh Delivery',
        order_id: orderData.razorpayOrderId,
        theme: { color: '#2e7d4f' },

        handler: async (response: RazorpayResponse) => {
          // Step 3: Confirm payment server-side
          const confirmRes = await fetch(`/api/orders/${orderData.orderId}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (confirmRes.ok) {
            clearCart();
            router.replace(`/checkout/success?orderId=${orderData.orderId}`);
          } else {
            addToast({
              title: 'Payment received but confirmation failed. Contact support.',
              variant: 'error',
              duration: 10000,
            });
          }
        },

        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      });

      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      addToast({ title: msg, variant: 'error' });
      setIsProcessing(false);
    }
  }, [isScriptLoaded, items, amount, couponCode, clearCart, addToast, router]);

  return (
    <>
      {/* Skill #16: Razorpay SDK loaded dynamically, only at checkout */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
      />

      <button
        onClick={handlePayment}
        disabled={isProcessing || !isScriptLoaded}
        className={cn(
          'flex h-14 w-full items-center justify-center gap-2 rounded-2xl',
          'bg-primary-600 text-base font-bold text-white',
          'transition-colors hover:bg-primary-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
        aria-label={`Pay ${formatPrice(amount)} securely with Razorpay`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden="true" />
            Pay {formatPrice(amount)} Securely
          </>
        )}
      </button>

      <p className="mt-2 text-center text-xs text-neutral-400">
        Secured by Razorpay · UPI · Cards · Wallets
      </p>
    </>
  );
}
