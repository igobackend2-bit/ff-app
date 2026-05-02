import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Confirmed — Farmers Factory',
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <CheckCircle2 className="h-8 w-8 text-primary-600" aria-hidden="true" />
        </div>

        {/* Skill #26 — ONE h1 */}
        <h1 className="text-2xl font-bold text-neutral-900">Order Confirmed! 🎉</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your groceries are being packed and will be at your door in minutes.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary-50 px-4 py-3">
          <Zap className="h-5 w-5 text-primary-600" aria-hidden="true" />
          <p className="text-sm font-bold text-primary-700">Delivery within 24 hours 🚚</p>
        </div>

        {orderId && (
          <p className="mt-3 font-mono text-xs text-neutral-400">Order: {orderId}</p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {orderId && (
            <Link
              href={`/account/orders/${orderId}`}
              className="flex items-center justify-center rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              Track Order
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
