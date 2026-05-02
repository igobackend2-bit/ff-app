// Customer: Live order tracking status
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const STATUS_STEPS = [
  { key: 'PENDING',          label: 'Order Placed',         emoji: '🛒', desc: 'Your order has been received.' },
  { key: 'CONFIRMED',        label: 'Order Confirmed',      emoji: '✅', desc: 'We have confirmed your order.' },
  { key: 'PICKING',          label: 'Picking Items',        emoji: '📦', desc: 'Our team is packing your items.' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',     emoji: '🚚', desc: 'Your order is on the way!' },
  { key: 'DELIVERED',        label: 'Delivered',            emoji: '🎉', desc: 'Your order has been delivered.' },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrls: true, unit: true } },
          },
        },
        address: true,
      },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);

    // ETA: rough estimate — 24 hrs from order creation, minus elapsed time
    const createdAt = new Date(order.createdAt);
    const etaAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const nowMs = Date.now();
    const remainingMs = Math.max(0, etaAt.getTime() - nowMs);
    const remainingHrs = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        address: order.address,
        items: order.items.map((item: any) => ({
          name: item.product.name,
          unit: item.product.unit,
          imageUrls: item.product.imageUrls,
          qty: item.quantity,
          price: item.unitPrice,
        })),
      },
      tracking: {
        steps: STATUS_STEPS.map((step, i) => ({
          ...step,
          status:
            i < currentStepIdx
              ? 'completed'
              : i === currentStepIdx
              ? 'current'
              : 'upcoming',
        })),
        currentStep: currentStepIdx,
        eta:
          order.status === 'DELIVERED' || order.status === 'CANCELLED'
            ? null
            : { hours: remainingHrs, minutes: remainingMins },
        location: order.status === 'OUT_FOR_DELIVERY' ? {
          lat: 19.0760 + (Math.random() - 0.5) * 0.01, // Simulated movement near Mumbai
          lng: 72.8777 + (Math.random() - 0.5) * 0.01,
          bearing: Math.random() * 360,
          speed: 15 + Math.random() * 10
        } : null,
        driver: order.status === 'OUT_FOR_DELIVERY' ? {
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
          rating: 4.8
        } : null
      },
    });
  } catch (err) {
    console.error('[orders/:id/track GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
