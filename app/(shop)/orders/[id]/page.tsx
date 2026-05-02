import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Receipt, Share2 } from 'lucide-react';
import { OrderTrackingCard } from '@/components/orders/OrderTrackingCard';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

// Mock function for order fetching
async function getOrder(id: string): Promise<Order | null> {
  // In a real app, this would be a Supabase/API call
  return {
    id,
    orderNumber: 'FF-88291',
    status: 'OUT_FOR_DELIVERY',
    paymentStatus: 'PAID',
    subtotal: 450,
    deliveryFee: 20,
    discount: 0,
    total: 470,
    estimatedDeliveryAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 mins from now
    deliveredAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    items: [
      {
        id: '1',
        productId: 'p1',
        quantity: 2,
        unitPrice: 200,
        total: 400,
        product: { name: 'Fresh Alphonso Mangoes', imageUrls: ['https://images.unsplash.com/photo-1553279768-865429fa0078'], unit: '1kg', slug: 'mango' }
      },
      {
        id: '2',
        productId: 'p2',
        quantity: 1,
        unitPrice: 50,
        total: 50,
        product: { name: 'Organic Bananas', imageUrls: ['https://images.unsplash.com/photo-1603833665858-e8188c3f4e2b'], unit: '6pcs', slug: 'banana' }
      }
    ],
    address: {
        id: 'a1',
        label: 'Home',
        line1: 'Flat 402, Green Valley Apartments',
        line2: 'Bannerghatta Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560076',
        lat: 12.87,
        lng: 77.59,
        isDefault: true
    }
  };
}

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-24 pt-4 md:px-0">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link 
            href="/orders" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100 text-neutral-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-bold text-neutral-400 uppercase tracking-widest leading-none">Order Tracking</h1>
            <p className="text-lg font-black text-neutral-900">#{order.orderNumber}</p>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100 text-neutral-900">
            <Share2 className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6">
          {/* Tracking Card */}
          <OrderTrackingCard 
            status={order.status} 
            estimatedDelivery="12:45 PM" 
          />

          {/* Delivery Address */}
          <section className="rounded-3xl bg-white p-6 border border-neutral-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-neutral-900">Delivery Address</h3>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">{order.address.label}</p>
              </div>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {order.address.line1}<br />
              {order.address.line2 && <>{order.address.line2}<br /></>}
              {order.address.city}, {order.address.pincode}
            </p>
          </section>

          {/* Order Summary */}
          <section className="rounded-3xl bg-white p-6 border border-neutral-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-black text-neutral-900 text-lg">Order Items</h3>
            </div>

            <div className="space-y-4 border-b border-dashed border-neutral-100 pb-6 mb-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-neutral-50 p-1">
                        <img 
                            src={item.product.imageUrls[0]} 
                            alt={item.product.name} 
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-neutral-500">{item.product.unit} × {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-neutral-900">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Items Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Delivery Fee</span>
                <span className="text-green-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-50 mt-2">
                <span className="font-black text-neutral-900">Total Paid</span>
                <span className="font-black text-primary-600 text-lg">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Help Button */}
          <button className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-neutral-200 py-4 font-bold text-neutral-600 transition-colors hover:bg-neutral-100">
            Need help with this order?
          </button>
        </div>
      </div>
    </div>
  );
}
