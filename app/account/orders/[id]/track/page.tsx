'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, CheckCircle2, Package, Truck, PartyPopper,
  ChevronLeft, Clock, Phone, RefreshCw, MapPin, User,
} from 'lucide-react';

interface TrackingStep {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface TrackingData {
  order: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    address: {
      line1: string;
      city: string;
      state: string;
      pincode: string;
    } | null;
    items: Array<{
      name: string;
      unit: string;
      qty: number;
      price: number;
    }>;
  };
  tracking: {
    steps: TrackingStep[];
    currentStep: number;
    eta: { hours: number; minutes: number } | null;
    driver: {
      name: string;
      phone: string;
      photo: string;
      rating: number;
    } | null;
  };
}

const STEP_ICONS = [ShoppingCart, CheckCircle2, Package, Truck, PartyPopper];

export default function OrderTrackPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/track`);
      if (!res.ok) throw new Error('Order not found');
      const json = (await res.json()) as TrackingData;
      setData(json);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    void fetchTracking();
    // Auto-refresh every 30 seconds when out for delivery
    const interval = setInterval(() => { void fetchTracking(true); }, 30000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const TopHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-neutral-100 bg-white px-4">
      <button
        onClick={() => router.back()}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50"
        aria-label="Go back"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-bold text-neutral-900">{title}</p>
        {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <TopHeader title={`Track Order #${orderId.slice(0, 8).toUpperCase()}`} />
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-neutral-500">Loading tracking info…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <TopHeader title="Track Order" />
        <div className="flex flex-col items-center justify-center gap-4 p-6 py-24">
          <Package className="h-12 w-12 text-neutral-300" />
          <p className="text-center text-sm font-medium text-neutral-600">{error || 'Order not found'}</p>
          <Link href="/account/orders" className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-700">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const { order, tracking } = data;
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-neutral-100 bg-white px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-neutral-900">
            Track Order #{orderId.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-neutral-500">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => void fetchTracking(true)}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
          aria-label="Refresh tracking"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mx-auto max-w-lg space-y-4 p-4">

        {/* ETA banner */}
        {tracking.eta && !isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl bg-primary-600 p-4 text-white shadow-md"
          >
            <Clock className="h-6 w-6 flex-shrink-0 text-primary-200" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-primary-200">Estimated Delivery</p>
              <p className="text-lg font-black">
                {tracking.eta.hours > 0
                  ? `${tracking.eta.hours}h ${tracking.eta.minutes}m`
                  : `${tracking.eta.minutes} min`} remaining
              </p>
            </div>
          </motion.div>
        )}

        {isDelivered && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 rounded-2xl bg-green-600 p-4 text-white shadow-md"
          >
            <PartyPopper className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-green-200">Delivered!</p>
              <p className="text-base font-black">Your order has been delivered 🎉</p>
            </div>
          </motion.div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm font-bold text-red-700">This order was cancelled.</p>
          </div>
        )}

        {/* Progress tracker */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-sm font-bold text-neutral-900">Order Status</h2>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-0.5 bg-neutral-100" aria-hidden="true" />
            <div
              className="absolute left-5 top-5 w-0.5 bg-primary-500 transition-all duration-700"
              style={{ height: `${Math.min(100, (tracking.currentStep / (tracking.steps.length - 1)) * 100)}%` }}
              aria-hidden="true"
            />

            <div className="space-y-6">
              {tracking.steps.map((step, i) => {
                const Icon = STEP_ICONS[i] ?? Package;
                const isComplete = step.status === 'completed';
                const isCurrent  = step.status === 'current';
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex items-start gap-4 pl-0"
                  >
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isComplete
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : isCurrent
                          ? 'border-primary-500 bg-white text-primary-600 shadow-md'
                          : 'border-neutral-200 bg-white text-neutral-300'
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-primary-400 opacity-30" />
                      )}
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 pt-1">
                      <p className={`text-sm font-bold ${isComplete || isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        {step.label}
                      </p>
                      {(isComplete || isCurrent) && (
                        <p className="mt-0.5 text-xs text-neutral-500">{step.desc}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Driver card (when out for delivery) */}
        <AnimatePresence>
          {tracking.driver && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
            >
              <h3 className="mb-3 text-sm font-bold text-neutral-900">Your Delivery Partner</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <User className="h-6 w-6 text-neutral-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-neutral-900">{tracking.driver.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-amber-500">★</span>
                    <span className="text-xs font-semibold text-neutral-600">{tracking.driver.rating}</span>
                  </div>
                </div>
                <a
                  href={`tel:${tracking.driver.phone}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100"
                  aria-label={`Call ${tracking.driver.name}`}
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delivery address */}
        {order.address && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-bold text-neutral-900">Delivery Address</h3>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" aria-hidden="true" />
              <p className="text-sm text-neutral-600">
                {order.address.line1}, {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-neutral-900">
            Order Summary ({order.items.length} item{order.items.length !== 1 ? 's' : ''})
          </h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-neutral-700">
                  {item.name} <span className="text-neutral-400">{item.unit}</span> × {item.qty}
                </span>
                <span className="font-semibold text-neutral-900">
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
            <span className="text-sm font-bold text-neutral-900">Total</span>
            <span className="text-base font-black text-primary-700">
              ₹{order.total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <Link
          href="/account/orders"
          className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          ← All Orders
        </Link>
      </div>
    </div>
  );
}
