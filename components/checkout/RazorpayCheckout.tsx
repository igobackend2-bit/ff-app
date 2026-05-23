'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Loader2, Lock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string; amount: number; currency: string; name: string;
  description: string; order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance { open: () => void; }
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface AddressData {
  fullName: string; phone: string; line1: string;
  city: string; state: string; pincode: string;
}

interface RazorpayCheckoutProps {
  amount: number;
  items: CartItem[];
  address: AddressData;
  onValidateAddress: () => boolean;
}

export function RazorpayCheckout({ amount, items, address, onValidateAddress }: RazorpayCheckoutProps) {
  const router    = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const addToast  = useUIStore((s) => s.addToast);

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);

  const handlePayment = useCallback(async () => {
    if (!onValidateAddress()) return;
    if (!isScriptLoaded || !window.Razorpay) {
      addToast({ title: 'Payment not ready. Please wait a moment.', variant: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      // Create order on server (Razorpay order + DB record)
      const orderRes = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          items:         items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod: 'RAZORPAY',
          address,
        }),
      });

      const orderData = await orderRes.json() as {
        orderId?: string; razorpayOrderId?: string;
        amount?: number; error?: string;
      };

      if (!orderRes.ok || !orderData.razorpayOrderId) {
        throw new Error(orderData.error ?? 'Failed to create payment order');
      }

      // Open Razorpay modal
      const rzp = new window.Razorpay({
        key:         process.env['NEXT_PUBLIC_RAZORPAY_KEY_ID'] ?? '',
        amount:      orderData.amount ?? amount * 100,
        currency:    'INR',
        name:        'Farmers Factory',
        description: 'Fresh Farm Delivery',
        order_id:    orderData.razorpayOrderId,
        theme:       { color: '#2e7d4f' },
        prefill:     { name: address.fullName, contact: address.phone },

        handler: async (response: RazorpayResponse) => {
          // Confirm payment on server
          const confirmRes = await fetch(`/api/orders/${orderData.orderId}/confirm`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          if (confirmRes.ok) {
            clearCart();
            addToast({ variant: 'success', title: '✅ Payment successful! Order confirmed.' });
            router.replace(`/checkout/success?orderId=${orderData.orderId}`);
          } else {
            addToast({ variant: 'error', title: 'Payment received but confirmation failed. Contact support.', duration: 10000 });
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
      });

      rzp.open();
    } catch (err) {
      addToast({ title: err instanceof Error ? err.message : 'Payment failed', variant: 'error' });
      setIsProcessing(false);
    }
  }, [isScriptLoaded, items, amount, address, onValidateAddress, clearCart, addToast, router]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <button
        onClick={() => void handlePayment()}
        disabled={isProcessing || !isScriptLoaded}
        className={cn(
          'flex h-14 w-full items-center justify-center gap-2 rounded-2xl',
          'bg-primary-600 text-base font-bold text-white transition-colors hover:bg-primary-700',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {isProcessing
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
          : <><Lock className="h-4 w-4" /> Pay {formatPrice(amount)} Securely</>}
      </button>
      <p className="text-center text-xs text-neutral-400">Secured by Razorpay · UPI · Cards · Wallets</p>
    </>
  );
}
