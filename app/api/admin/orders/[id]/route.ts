// Admin: Update order status — uses ERP Supabase (Prisma is DB_DISABLED=1 in production)
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const VALID_STATUSES = ['PLACED','CONFIRMED','PICKING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED'];

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Order Placed', CONFIRMED: 'Confirmed', PICKING: 'Picking Items',
  OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
};

function parseImgs(p?: Record<string, unknown>): string[] {
  if (!p) return [];
  const iu = p['image_urls'];
  if (Array.isArray(iu)) return iu as string[];
  if (typeof iu === 'string' && iu.trim()) { try { return JSON.parse(iu) as string[]; } catch { return [iu]; } }
  return typeof p['image_url'] === 'string' && p['image_url'] ? [p['image_url'] as string] : [];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    const filter = isUuid ? `id=eq.${id}` : `order_number=eq.${encodeURIComponent(id)}`;

    // Order row — orders table first, then sales_orders.
    let order: Record<string, unknown> | null = null;
    const res = await fetch(`${SB}/rest/v1/orders?${filter}&select=*&limit=1`, { headers: H, cache: 'no-store' });
    if (res.ok) { const rows = await res.json() as Record<string, unknown>[]; if (rows[0]) order = rows[0]; }
    if (!order) {
      const res2 = await fetch(`${SB}/rest/v1/sales_orders?${filter}&select=*&limit=1`, { headers: H, cache: 'no-store' });
      if (res2.ok) { const rows2 = await res2.json() as Record<string, unknown>[]; if (rows2[0]) order = rows2[0]; }
    }
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Line items — keyed off the resolved order id.
    let items: unknown[] = [];
    const oid = order['id'];
    if (oid) {
      const ir = await fetch(
        `${SB}/rest/v1/order_items?order_id=eq.${oid}&select=id,product_id,quantity,unit_price,total,products(name,unit,image_url,image_urls)`,
        { headers: H, cache: 'no-store' },
      );
      if (ir.ok) {
        const raw = await ir.json() as Array<Record<string, unknown>>;
        items = raw.map((i) => ({
          id:        i['id'],
          productId: i['product_id'] ?? '',
          name:      (i['products'] as any)?.name ?? 'Item',
          unit:      (i['products'] as any)?.unit ?? '',
          quantity:  Number(i['quantity'] ?? 0),
          unitPrice: Number(i['unit_price'] ?? 0),
          total:     Number(i['total'] ?? Number(i['unit_price'] ?? 0) * Number(i['quantity'] ?? 0)),
          imageUrls: parseImgs(i['products'] as Record<string, unknown>),
        }));
      }
    }

    return NextResponse.json({ order, items });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json() as { status?: string };
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    // Update in orders table
    const r1 = await fetch(`${SB}/rest/v1/orders?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      cache: 'no-store',
    });
    const updated1 = r1.ok ? await r1.json() as unknown[] : [];

    // Update in sales_orders table too (admin UI reads from there)
    await fetch(`${SB}/rest/v1/sales_orders?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    });

    const orderData = updated1[0] as Record<string, unknown> | undefined;

    // Insert status-change notification into notifications table
    try {
      const label = STATUS_LABELS[status] ?? status;
      const orderNum = orderData?.['order_number'] ?? id.slice(0, 8);
      const userId = orderData?.['user_id'] ?? null;

      await fetch(`${SB}/rest/v1/notifications`, {
        method: 'POST',
        headers: { ...H, Prefer: 'return=minimal' },
        body: JSON.stringify({
          type:    'ORDER_STATUS',
          title:   `Order #${orderNum} — ${label}`,
          message: `Your order #${orderNum} status has been updated to: ${label}`,
          user_id: userId,
          source:  'admin',
          is_read: false,
        }),
        cache: 'no-store',
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ order: { id, status } });
  } catch (err) {
    console.error('[admin/orders/:id PATCH]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
