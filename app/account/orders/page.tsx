import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrderList } from '@/components/orders/OrderList';

export const metadata: Metadata = {
  title: 'My Orders — Farmers Factory',
  description: 'View your order history and track deliveries.',
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
      {/* Skill #26 — ONE h1 */}
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">My Orders</h1>

      <Suspense
        fallback={
          <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        }
      >
        <OrderList />
      </Suspense>
    </div>
  );
}
