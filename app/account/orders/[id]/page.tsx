'use client';

import React, { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, HelpCircle, Package, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { OrderTracking } from '@/components/orders/OrderTracking';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

interface LocalOrder {
  id: string;
  orderNumber?: string;
  status?: string;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  paymentMethod?: string;
  createdAt?: string;
  items?: Array<{
    id?: string;
    name?: string;
    quantity?: number;
    unitPrice?: number;
    imageUrls?: string[];
    unit?: string;
  }>;
}

function OrderDetailView({ order }: { order: LocalOrder }) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    PLACED:           { label: 'Order Placed',     color: 'text-blue-600 bg-blue-50' },
    CONFIRMED:        { label: 'Confirmed',         color: 'text-indigo-600 bg-indigo-50' },
    PICKING:          { label: 'Picking Items',     color: 'text-amber-600 bg-amber-50' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: 'text-green-700 bg-green-50' },
    DELIVERED:        { label: 'Delivered',         color: 'text-green-700 bg-green-50' },
    CANCELLED:        { label: 'Cancelled',         color: 'text-red-600 bg-red-50' },
  };
  const statusInfo = statusLabels[order.status ?? 'PLACED'] ?? statusLabels['PLACED'];

  return (
    <div className="space-y-4 pb-10">
      {/* Order header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-sm font-bold text-neutral-800">#{order.orderNumber ?? order.id.slice(-8).toUpperCase()}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-neutral-700 uppercase tracking-wide">
          Order Items ({order.items?.length ?? 0})
        </h3>
        <div className="divide-y divide-neutral-100">
          {(order.items ?? []).map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              {/* Product image */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50">
                {item.imageUrls?.[0] ? (
                  <Image
                    src={item.imageUrls[0]}
                    alt={item.name ?? ''}
                    fill
                    sizes="56px"
                    className="object-contain p-1"
                    unoptimized
                  />
                ) : (
                  <Package className="m-auto h-6 w-6 text-neutral-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">{item.name ?? 'Product'}</p>
                <p className="text-xs text-neutral-400">Qty: {item.quantity ?? 1}{item.unit ? ` · ${item.unit}` : ''}</p>
              </div>
              <p className="text-sm font-bold text-neutral-900 shrink-0">
                {formatPrice((item.unitPrice ?? 0) * (item.quantity ?? 1))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Price summary */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-bold text-neutral-700 uppercase tracking-wide">Bill Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal ?? order.total ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Delivery</span>
            <span className={(order.deliveryFee ?? 0) === 0 ? 'text-green-600 font-semibold' : ''}>
              {(order.deliveryFee ?? 0) === 0 ? 'FREE' : formatPrice(order.deliveryFee ?? 0)}
            </span>
          </div>
          <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-black text-neutral-900">
            <span>Total</span>
            <span className="text-primary-700">{formatPrice(order.total ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      {order.paymentMethod && (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <CreditCard className="h-5 w-5 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-400 uppercase tracking-wide">Payment</p>
            <p className="text-sm font-semibold text-neutral-800">
              {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
            </p>
          </div>
        </div>
      )}

      {/* Track order link */}
      {!['DELIVERED','CANCELLED','REFUNDED'].includes(order.status ?? '') && (
        <Link
          href={`/account/orders/${order.id}/track`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white"
        >
          <MapPin className="h-4 w-4" /> Track Order
        </Link>
      )}
    </div>
  );
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [localOrder, setLocalOrder] = useState<LocalOrder | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ff_local_orders');
      if (raw) {
        const all = JSON.parse(raw) as LocalOrder[];
        const found = all.find((o) => o.id === orderId);
        if (found) setLocalOrder(found);
      }
    } catch { /* ignore */ }
    setChecked(true);
  }, [orderId]);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pt-4 md:px-0">
      <div className="mx-auto max-w-lg">
        {/* Navigation Header */}
        <div className="flex items-center justify-between py-4">
          <Link href="/account/orders">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-white shadow-sm hover:translate-x-[-2px] transition-transform">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">Order Details</h1>
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white shadow-sm">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Support banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 mt-2 flex items-center justify-between rounded-2xl bg-neutral-900 p-4 text-white shadow-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-white/10 p-2">
              <HelpCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400">Need help with this order?</p>
              <p className="text-sm font-bold">Contact Support</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-xs hover:bg-white/10">
            Chat Now
          </Button>
        </motion.div>

        {/* Content — local order shows full details, cloud order shows tracking */}
        {checked && localOrder ? (
          <OrderDetailView order={localOrder} />
        ) : checked ? (
          <OrderTracking orderId={orderId} />
        ) : null}
      </div>
    </div>
  );
}
