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
    // Cashfree v3 SDK factory
    Cashfree?: (opts: { mode: 'sandbox' | 'production' }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<{
        error?: { message?: string };
        redirect?: boolean;
        paymentDetails?: { paymentMessage?: string };
      }>;
    };
  }
}

interface AddressData {
  fullName: string; phone: string; line1: string;
  city: string; state: string; pincode: string;
}

interface CashfreeCheckoutProps {
  amount: number;
  items: CartItem[];
  address: AddressData;
  onValidateAddress: () => boolean;
  disabled?: boolean;
}

export function CashfreeCheckout({ amount, items, address, onValidateAddress, disabled }: CashfreeCheckoutProps) {
  const router    = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const addToast  = useUIStore((s) => s.addToast);

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);

  const handlePayment = useCallback(async () => {
    if (!onValidateAddress()) return;
    if (!isScriptLoaded || typeof window.Cashfree !== 'function') {
      addToast({ title: 'Payment not ready. Please wait a moment.', variant: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create the order (Supabase record)
      const orderRes = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          items:         items.map((i) => ({ productId: i.productId, name: i.product?.name, quantity: i.quantity, unitPrice: i.product?.price ?? 0 })),
          paymentMethod: 'CASHFREE',
          address,
        }),
      });
      const orderData = await orderRes.json() as { order?: { id: string; total: number }; error?: string };
      if (!orderRes.ok || !orderData.order?.id) {
        throw new Error(orderData.error ?? 'Failed to create order');
      }
      const orderId = orderData.order.id;

      // 2. Ask our server for a Cashfree payment session
      const sessRes = await fetch('/api/payments/cashfree', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orderId,
          amount:        orderData.order.total ?? amount,
          customerName:  address.fullName,
          customerPhone: address.phone,
        }),
      });
      const sess = await sessRes.json() as { paymentSessionId?: string; mode?: 'sandbox' | 'production'; error?: string };
      if (!sessRes.ok || !sess.paymentSessionId) {
        throw new Error(sess.error ?? 'Could not start payment');
      }

      // 3. Open Cashfree checkout (modal)
      const cashfree = window.Cashfree!({ mode: sess.mode ?? 'sandbox' });
      const result = await cashfree.checkout({
        paymentSessionId: sess.paymentSessionId,
        redirectTarget:   '_modal',
      });

      if (result.error) {
        addToast({ variant: 'error', title: result.error.message ?? 'Payment cancelled' });
        setIsProcessing(false);
        return;
      }

      // 4. Verify with our server (writes payment_status to the order → admin sees it)
      const verifyRes = await fetch('/api/payments/cashfree/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId }),
      });
      const verify = await verifyRes.json() as { paid?: boolean; status?: string };

      if (verify.paid) {
        clearCart();
        addToast({ variant: 'success', title: '✅ Payment successful! Order confirmed.' });
        router.replace(`/checkout/success?orderId=${orderId}`);
      } else {
        addToast({
          variant: 'error',
          title: `Payment not completed (${verify.status ?? 'pending'}). If money was deducted it will auto-refund.`,
          duration: 10000,
        });
        setIsProcessing(false);
      }
    } catch (err) {
      addToast({ title: err instanceof Error ? err.message : 'Payment failed', variant: 'error' });
      setIsProcessing(false);
    }
  }, [isScriptLoaded, items, amount, address, onValidateAddress, clearCart, addToast, router]);

  return (
    <>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <button
        onClick={() => void handlePayment()}
        disabled={isProcessing || !isScriptLoaded || disabled}
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
      <p className="text-center text-xs text-neutral-400">Secured by Cashfree · UPI · Cards · Wallets · NetBanking</p>
    </>
  );
}
