// Customer: Live order tracking status
import { NextRequest, NextResponse } from 'next/server';

const SB_URL  = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const SB_SERV = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

const STATUS_STEPS = [
  { key: 'PLACED',           label: 'Order Placed',     emoji: '🛒', desc: 'Your order has been received.' },
  { key: 'CONFIRMED',        label: 'Order Confirmed',  emoji: '✅', desc: 'We have confirmed your order.' },
  { key: 'PICKING',          label: 'Picking Items',    emoji: '📦', desc: 'Our team is packing your items.' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', emoji: '🚚', desc: 'Your order is on the way!' },
  { key: 'DELIVERED',        label: 'Delivered',        emoji: '🎉', desc: 'Your order has been delivered.' },
];

function buildTrackingResponse(order: {
  id: string; status: string; total: number; created_at: string;
  delivery_address?: string;
}, items: Array<{ product_name?: string; quantity: number; unit_price: number }>) {
  const status = order.status ?? 'PLACED';
  let stepStatus = status;
  if (stepStatus === 'CANCELLED' || stepStatus === 'REFUNDED') stepStatus = 'PLACED';
  const currentStepIdx = Math.max(0, STATUS_STEPS.findIndex((s) => s.key === stepStatus));

  const createdAt    = new Date(order.created_at ?? Date.now());
  const etaAt        = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const remainingMs  = Math.max(0, etaAt.getTime() - Date.now());
  const remainingHrs = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMin = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  // Parse address from stored string format
  let parsedAddress = null;
  if (order.delivery_address) {
    const lines = order.delivery_address.split('\n');
    parsedAddress = {
      line1:   lines[2]?.split(',')[0]?.trim() ?? '',
      city:    lines[2]?.split(',')[1]?.trim() ?? '',
      state:   lines[2]?.split(',')[2]?.split('-')[0]?.trim() ?? '',
      pincode: lines[2]?.split('-')[1]?.trim() ?? '',
    };
  }

  return {
    order: {
      id:        order.id,
      status,
      total:     Number(order.total ?? 0),
      createdAt: order.created_at,
      address:   parsedAddress,
      items:     items.map((i) => ({
        name:      i.product_name ?? '',
        unit:      '',
        imageUrls: [] as string[],
        qty:       i.quantity,
        price:     Number(i.unit_price ?? 0),
      })),
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
        status === 'DELIVERED' || status === 'CANCELLED'
          ? null
          : { hours: remainingHrs, minutes: remainingMin },
      location:
        status === 'OUT_FOR_DELIVERY'
          ? { lat: 13.0827, lng: 80.2707, bearing: 45, speed: 30 }
          : null,
      driver: null,
    },
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Local orders (Supabase unavailable at time of placement) — return PLACED status
    if (id.startsWith('local-')) {
      const ts = parseInt(id.replace('local-', ''), 10) || Date.now();
      return NextResponse.json(buildTrackingResponse(
        { id, status: 'PLACED', total: 0, created_at: new Date(ts).toISOString() },
        [],
      ));
    }

    // Try Supabase REST API
    const key = SB_SERV;
    const url = `${SB_URL}/rest/v1/orders?id=eq.${id}&select=id,status,total,total_amount,created_at,delivery_address&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const rows = await res.json() as any[];
    if (!rows.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = rows[0] as any;

    // Fetch order items
    let items: any[] = [];
    try {
      const itemsRes = await fetch(
        `${SB_URL}/rest/v1/order_items?order_id=eq.${id}&select=product_name,quantity,unit_price`,
        { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' },
      );
      if (itemsRes.ok) items = await itemsRes.json() as any[];
    } catch { /* items unavailable */ }

    return NextResponse.json(buildTrackingResponse(
      { ...order, total: order.total_amount ?? order.total ?? 0 },
      items,
    ));
  } catch (err) {
    console.error('[track GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
