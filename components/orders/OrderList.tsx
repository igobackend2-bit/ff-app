'use client';

// Skill #51 — loading / error / empty state for every data fetch

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight, RotateCcw, MapPin } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatPrice, timeAgo } from '@/lib/utils';
import type { Order } from '@/types';

const ORDER_STATUS_LABELS: Record<Order['status'], { label: string; color: string }> = {
  PLACED: { label: 'Order Placed', color: 'text-blue-600 bg-blue-50' },
  CONFIRMED: { label: 'Confirmed', color: 'text-indigo-600 bg-indigo-50' },
  PICKING: { label: 'Picking Items', color: 'text-amber-600 bg-amber-50' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-primary-700 bg-primary-50' },
  DELIVERED: { label: 'Delivered', color: 'text-primary-700 bg-primary-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-danger-600 bg-danger-50' },
  REFUNDED: { label: 'Refunded', color: 'text-neutral-600 bg-neutral-100' },
};

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.status === 401) {
          setError('login_required');
          return;
        }
        if (!res.ok) throw new Error('Failed to load orders');
        const data = (await res.json()) as { data: Order[] };
        setOrders(data.data ?? []);
      } catch {
        setError('Could not load your orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchOrders();
  }, []);

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      // API returns flat items: name, unit, slug, imageUrls are top-level
      addItem(
        {
          id: item.productId,
          name: item.name,
          slug: item.slug,
          unit: item.unit,
          imageUrls: item.imageUrls ?? [],
          blurDataUrls: [],
          categoryId: '',
          brandId: null,
          sku: '',
          description: null,
          mrp: item.unitPrice,
          price: item.unitPrice,
          tags: [],
          isFeatured: false,
          inStock: true,
          averageRating: 0,
          reviewCount: 0,
        },
        item.quantity,
      );
    });
    openDrawer();
    addToast({ title: 'Items added to cart!', variant: 'success' });
  };

  // Skill #51 — Loading state
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" aria-hidden="true" />
        ))}
        <span className="sr-only">Loading your orders…</span>
      </div>
    );
  }

  // Skill #51 — Error state
  if (error === 'login_required') {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-neutral-200" />
        <p className="font-semibold text-neutral-700">Please log in to view your orders</p>
        <p className="mt-1 text-sm text-neutral-500">Sign in to see your order history.</p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-center">
        <p className="text-sm text-danger-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-sm font-medium text-danger-700 underline">
          Try again
        </button>
      </div>
    );
  }

  // Skill #51 — Empty state
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-neutral-200" aria-hidden="true" />
        <p className="font-semibold text-neutral-700">No orders yet</p>
        <p className="mt-1 text-sm text-neutral-500">Your past orders will appear here.</p>
        <Link
          href="/"
          className={cn(
            'mt-4 inline-block rounded-xl bg-primary-600 px-6 py-2.5',
            'text-sm font-semibold text-white',
            'transition-colors hover:bg-primary-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
          )}
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Your orders">
      {orders.map((order) => {
        const statusInfo = ORDER_STATUS_LABELS[order.status];

        return (
          <li key={order.id}>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-neutral-600">
                    #{order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {timeAgo(order.createdAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    statusInfo.color,
                  )}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* Product thumbnails — API returns flat items */}
              <div className="mt-3 flex items-center gap-2">
                {order.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="relative h-10 w-10 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50"
                  >
                    {item.imageUrls?.[0] && (
                      <Image
                        src={item.imageUrls[0]}
                        alt={`${item.name} ${item.unit}`}
                        fill
                        sizes="40px"
                        className="object-contain p-0.5"
                      />
                    )}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <span className="text-xs text-neutral-500">
                    +{order.items.length - 4} more
                  </span>
                )}
              </div>

              {/* Footer row */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-bold text-neutral-900">
                  {formatPrice(order.total)}
                </p>

                <div className="flex items-center gap-2">
                  {/* One-tap reorder button */}
                  <button
                    onClick={() => handleReorder(order)}
                    aria-label={`Reorder order #${order.orderNumber}`}
                    className={cn(
                      'flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5',
                      'text-xs font-semibold text-primary-700',
                      'transition-colors hover:bg-primary-50',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                    )}
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Reorder
                  </button>

                  {/* Track button — shown for active orders */}
                  {!['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
                    <Link
                      href={`/account/orders/${order.id}/track`}
                      aria-label={`Track order #${order.orderNumber}`}
                      className={cn(
                        'flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5',
                        'text-xs font-semibold text-primary-700',
                        'transition-colors hover:bg-primary-100',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                      )}
                    >
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      Track
                    </Link>
                  )}

                  <Link
                    href={`/account/orders/${order.id}`}
                    aria-label={`View details for order #${order.orderNumber}`}
                    className={cn(
                      'flex items-center gap-1 rounded-lg bg-neutral-100 px-3 py-1.5',
                      'text-xs font-semibold text-neutral-700',
                      'transition-colors hover:bg-neutral-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                    )}
                  >
                    Details
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
