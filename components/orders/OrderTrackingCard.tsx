'useChild';

import { motion } from 'framer-motion';
import { Check, Truck, Package, ShoppingBag, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface OrderTrackingCardProps {
  status: OrderStatus;
  estimatedDelivery: string | null;
}

const STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'PLACED', label: 'Order Placed', icon: ShoppingBag },
  { status: 'CONFIRMED', label: 'Confirmed', icon: Check },
  { status: 'PICKING', label: 'Packing', icon: Package },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: Check },
];

export function OrderTrackingCard({ status, estimatedDelivery }: OrderTrackingCardProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.status === status);
  const isCancelled = status === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="rounded-3xl bg-red-50 p-6 border border-red-100 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
           <Check className="h-6 w-6 rotate-45" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-900">Order Cancelled</h3>
          <p className="text-sm text-red-600">This order has been cancelled and a refund has been initiated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-neutral-100 border border-neutral-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</p>
          <h3 className="text-xl font-black text-neutral-900">
            {STEPS[currentStepIndex]?.label || status}
          </h3>
        </div>
        {estimatedDelivery && (
             <div className="text-right">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Expected</p>
                <div className="flex items-center gap-1.5 text-primary-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-lg font-black">{estimatedDelivery}</span>
                </div>
             </div>
        )}
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-100" />
        <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
            className="absolute left-6 top-0 w-0.5 bg-primary-600 origin-top"
        />

        <div className="space-y-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.status} className="relative flex items-center gap-6">
                <div className={cn(
                    "relative z-10 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500",
                    isCompleted ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "bg-neutral-100 text-neutral-300",
                    isCurrent && "ring-4 ring-primary-50"
                )}>
                  <Icon className={cn("h-6 w-6", isCurrent && "animate-pulse")} />
                </div>
                
                <div>
                   <p className={cn(
                        "font-bold transition-colors duration-500",
                        isCompleted ? "text-neutral-900" : "text-neutral-300",
                        isCurrent && "text-primary-600 text-lg"
                   )}>
                        {step.label}
                   </p>
                   {isCurrent && (
                       <p className="text-xs font-medium text-neutral-500">
                           {index === 0 ? "We have received your order" : 
                            index === 1 ? "Order is confirmed and being processed" :
                            index === 2 ? "Items are being picked and packed" :
                            index === 3 ? "Our rider is on the way to you" :
                            "Arrived at your doorstep"}
                       </p>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
