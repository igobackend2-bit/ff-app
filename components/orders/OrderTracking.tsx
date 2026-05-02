'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Star,
  Navigation,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TrackingData {
  order: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    address: any;
    items: any[];
  };
  tracking: {
    steps: any[];
    currentStep: number;
    eta: { hours: number; minutes: number } | null;
    location: { lat: number; lng: number; bearing: number; speed: number } | null;
    driver: { name: string; phone: string; photo: string; rating: number } | null;
  };
}

export const OrderTracking = ({ orderId }: { orderId: string }) => {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/track`);
      if (!res.ok) throw new Error('Order not found');
      const d = await res.json();
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const timer = setInterval(fetchTracking, 5000); // Poll every 5s for "live" feel
    return () => clearInterval(timer);
  }, [orderId]);

  if (loading) return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-neutral-500">Retrieving live tracking data...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <Package className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-neutral-900">Oops! Failed to track</h2>
      <p className="max-w-xs text-sm text-neutral-500">{error || "We couldn't find this order."}</p>
    </div>
  );

  const { order, tracking } = data;
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="space-y-6 pb-20">
      {/* Live Map Placeholder / Radar UI */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-1 shadow-2xl">
        <div className="relative h-64 w-full rounded-[20px] bg-neutral-800">
          {/* Simulated Map Grid */}
          <div className="absolute inset-0 opacity-20" 
            style={{ 
              backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', 
              backgroundSize: '30px 30px' 
            }} 
          />
          
          <AnimatePresence mode="wait">
            {tracking.location ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Radar Ring */}
                <motion.div 
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="h-20 w-20 rounded-full border-2 border-primary/50"
                />
                
                {/* Driver Marker */}
                <div className="relative flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div className="mt-2 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                    LIVE: {tracking.location.lat.toFixed(4)}, {tracking.location.lng.toFixed(4)}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div className="space-y-2">
                  <MapPin className="mx-auto h-8 w-8 text-neutral-600" />
                  <p className="text-xs text-neutral-500">
                    {isDelivered ? "Order Delivered Successfully" : "Order is being prepared..."}
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Location Badge */}
          <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-lg">
            Mumbai Center
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order ID</p>
            <h1 className="text-lg font-black text-neutral-900">#{order.id.slice(-8).toUpperCase()}</h1>
          </div>
          {tracking.eta && (
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Est. Arrival</p>
              <h2 className="text-xl font-black text-neutral-900">
                {tracking.eta.hours}h {tracking.eta.minutes}m
              </h2>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className={tracking.currentStep >= 0 ? "text-primary" : "text-neutral-300"}>Order Placed</span>
            <span className={tracking.currentStep >= 4 ? "text-primary" : "text-neutral-300"}>Delivered</span>
          </div>
          <Progress value={(tracking.currentStep + 1) * 20} className="h-2 rounded-full bg-neutral-100" />
        </div>
      </div>

      {/* Status Steps */}
      <div className="space-y-4">
        <h3 className="px-1 text-sm font-bold uppercase tracking-wider text-neutral-500">Tracking History</h3>
        <div className="relative space-y-6 pl-8">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-2 h-[calc(100%-20px)] w-0.5 bg-neutral-100" />
          
          {tracking.steps.map((step, i) => (
            <div key={step.key} className="relative">
              {/* Connector Dot */}
              <div className={`absolute -left-[23px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                step.status === 'completed' ? 'border-primary bg-primary' : 
                step.status === 'current' ? 'border-primary' : 'border-neutral-200'
              }`}>
                {step.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-white" />}
                {step.status === 'current' && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
              </div>

              <div className={`flex flex-col ${step.status === 'upcoming' ? 'opacity-40' : ''}`}>
                <span className="text-sm font-bold text-neutral-900">{step.label}</span>
                <span className="text-xs text-neutral-500">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Card */}
      {tracking.driver && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-3xl border bg-primary/5 p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white shadow-md">
              <img src={tracking.driver.photo} alt={tracking.driver.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-neutral-900">{tracking.driver.name}</h4>
                <div className="flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] shadow-sm">
                  <Star className="mr-0.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{tracking.driver.rating}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500">Your delivery partner is nearby</p>
            </div>
            <a 
              href={`tel:${tracking.driver.phone}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        </motion.div>
      )}

      {/* Order Items Summary */}
      <div className="rounded-3xl border bg-white p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">Order Items</h3>
        <div className="divide-y divide-neutral-100">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-neutral-50">
                  <img src={item.imageUrls[0]} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">{item.name}</p>
                  <p className="text-[10px] text-neutral-500">{item.qty} {item.unit}</p>
                </div>
              </div>
              <p className="text-sm font-black text-neutral-900">₹{item.price * item.qty}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
