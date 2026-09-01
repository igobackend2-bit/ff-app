// Customer: Live order tracking status
import { NextRequest, NextResponse } from 'next/server';
import { localizeImageUrls } from '@/lib/clean-name';

/** products.image_urls is stored as a JSON string — parse + localise it. */
function itemImages(p?: { image_urls?: unknown; image_url?: unknown }): string[] {
  if (!p) return [];
  let arr: string[] = [];
  const raw = p.image_urls;
  if (Array.isArray(raw)) arr = raw as string[];
  else if (typeof raw === 'string' && raw.trim()) {
    try { arr = JSON.parse(raw) as string[]; } catch { arr = [raw]; }
  }
  if (arr.length === 0 && typeof p.image_url === 'string' && p.image_url) arr = [p.image_url];
  return localizeImageUrls(arr);
}

const SB_URL  = 'https://qwiumswrbddwmlraktvy.supabase.co';
// The literal is only the ANON key; RLS blocks it, so /track always 404'd.
// Prefer the real service-role key from env.
const SB_SERV =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

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
}, items: Array<{ product_id?: string; product_name?: string; products?: { name?: string; unit?: string; image_url?: string; image_urls?: string[] }; quantity: number; unit_price: number }>) {
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
        productId: i.product_id ?? '',
        name:      i.products?.name ?? i.product_name ?? 'Item',
        unit:      i.products?.unit ?? '',
        imageUrls: itemImages(i.products),
        qty:       i.quantity,
        quantity:  i.quantity,
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

    // Try Supabase REST API — match by UUID id OR the human order number.
    const key = SB_SERV;
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    const filter = isUuid ? `id=eq.${id}` : `order_number=eq.${encodeURIComponent(id)}`;
    const url = `${SB_URL}/rest/v1/orders?${filter}&select=id,status,total,total_amount,created_at,delivery_address&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
    });

    let order: any = null;
    if (res.ok) {
      const rows = await res.json() as any[];
      if (rows.length) order = rows[0];
    }

    // Fallback: check sales_orders (ERP table) if not found in orders
    if (!order) {
      const res2 = await fetch(
        `${SB_URL}/rest/v1/sales_orders?id=eq.${id}&select=id,status,total,total_amount,created_at,delivery_address&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' },
      );
      if (res2.ok) {
        const rows2 = await res2.json() as any[];
        if (rows2.length) order = rows2[0];
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items — key off the resolved order id, not the URL param.
    let items: any[] = [];
    try {
      const itemsRes = await fetch(
        `${SB_URL}/rest/v1/order_items?order_id=eq.${order.id}&select=product_id,quantity,unit_price,products(name,unit,image_url,image_urls)`,
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
