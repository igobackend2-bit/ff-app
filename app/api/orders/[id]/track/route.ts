// Customer: Live order tracking status
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const STATUS_STEPS = [
  { key: 'PLACED',           label: 'Order Placed',     emoji: '🛒', desc: 'Your order has been received.' },
  { key: 'CONFIRMED',        label: 'Order Confirmed',  emoji: '✅', desc: 'We have confirmed your order.' },
  { key: 'PICKING',          label: 'Picking Items',    emoji: '📦', desc: 'Our team is packing your items.' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', emoji: '🚚', desc: 'Your order is on the way!' },
  { key: 'DELIVERED',        label: 'Delivered',        emoji: '🎉', desc: 'Your order has been delivered.' },
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

    let statusForStep = order.status;
    if (statusForStep === 'CANCELLED' || statusForStep === 'REFUNDED') statusForStep = 'PLACED';
    const currentStepIdx = Math.max(0, STATUS_STEPS.findIndex((s) => s.key === statusForStep));

    const createdAt  = new Date(order.createdAt);
    const etaAt      = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const remainingMs   = Math.max(0, etaAt.getTime() - Date.now());
    const remainingHrs  = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        address: order.address,
        items: order.items.map((item: any) => {
          let imgs: string[] = [];
          try { imgs = JSON.parse(item.product.imageUrls as string) as string[]; }
          catch { imgs = item.product.imageUrls ? [item.product.imageUrls as string] : []; }
          return {
            name: item.product.name,
            unit: item.product.unit,
            imageUrls: imgs,
            qty: item.quantity,
            price: item.unitPrice,
          };
        }),
      },
      tracking: {
        steps: STATUS_STEPS.map((step, i) => ({
          ...step,
          status:
            i < currentStepIdx ? 'completed'
            : i === currentStepIdx ? 'current'
            : 'upcoming',
        })),
        currentStep: currentStepIdx,
        eta:
          order.status === 'DELIVERED' || order.status === 'CANCELLED'
            ? null
            : { hours: remainingHrs, minutes: remainingMins },
        location:
          order.status === 'OUT_FOR_DELIVERY'
            ? { lat: 13.0827, lng: 80.2707, bearing: 45 }
            : null,
        deliveryAddress:
          order.address
            ? `${(order.address as any).city ?? ''}, ${(order.address as any).state ?? ''}`.replace(/^, |, $/, '')
            : 'Chennai',
      },
    });
  } catch (err) {
    console.error('[track GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
