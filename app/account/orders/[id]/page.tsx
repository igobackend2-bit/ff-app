'use client';

import React, { use } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { OrderTracking } from '@/components/orders/OrderTracking';
import { Button } from '@/components/ui/button';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

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
          <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">Order Tracking</h1>
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white shadow-sm">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 mt-4 flex items-center justify-between rounded-2xl bg-neutral-900 p-4 text-white shadow-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-primary/20 p-2">
              <HelpCircle className="h-5 w-5 text-primary" />
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

        {/* Main Tracking Component */}
        <OrderTracking orderId={resolvedParams.id} />
      </div>
    </div>
  );
}
