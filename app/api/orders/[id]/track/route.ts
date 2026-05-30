import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

const STATUS_STEPS = [
  { key: 'PLACED',           label: 'Order Placed',     emoji: '🛒', desc: 'Your order has been received.' },
  { key: 'CONFIRMED',        label: 'Order Confirmed',  emoji: '✅', desc: 'We have confirmed your order.' },
  { key: 'PICKING',          label: 'Picking Items',    emoji: '📦', desc: 'Our team is packing your items.' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', emoji: '🚚', desc: 'Your order is on the way!' },
  { key: 'DELIVERED',        label: 'Delivered',        emoji: '🎉', desc: 'Your order has been delivered.' },
];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(
      `${SB}/rest/v1/orders?id=eq.${id}&select=*,order_items(*,products(name,image_urls,unit)),addresses(*)&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }
    );
    const rows: any[] = await res.json();
    if (!rows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const o = rows[0];
    let statusForStep = o.status;
    if (statusForStep === 'CANCELLED' || statusForStep === 'REFUNDED') statusForStep = 'PLACED';
    const currentStepIdx = Math.max(0, STATUS_STEPS.findIndex((s) => s.key === statusForStep));

    const createdAt = new Date(o.created_at);
    const etaAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const remainingMs = Math.max(0, etaAt.getTime() - Date.now());

    return NextResponse.json({
      order: {
        id: o.id, status: o.status, total: o.total, createdAt: o.created_at,
        address: o.addresses,
        items: (o.order_items ?? []).map((item: any) => {
          let imgs: string[] = [];
          try { imgs = JSON.parse(item.products?.image_urls ?? '[]'); } catch {}
          return { name: item.products?.name, unit: item.products?.unit, imageUrls: imgs, qty: item.quantity, price: item.unit_price };
        }),
      },
      tracking: {
        steps: STATUS_STEPS.map((step, i) => ({
          ...step, status: i < currentStepIdx ? 'completed' : i === currentStepIdx ? 'current' : 'upcoming',
        })),
        currentStep: currentStepIdx,
        eta: o.status === 'DELIVERED' || o.status === 'CANCELLED' ? null : {
          hours: Math.floor(remainingMs / 3600000),
          minutes: Math.floor((remainingMs % 3600000) / 60000),
        },
        location: o.status === 'OUT_FOR_DELIVERY' ? { lat: 13.0827, lng: 80.2707, bearing: 45 } : null,
        deliveryAddress: o.addresses ? `${o.addresses.city ?? ''}, ${o.addresses.state ?? ''}`.replace(/^, |, $/, '') : 'Chennai',
      },
    });
  } catch (err) {
    console.error('[track GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
