// Admin: Update order status — uses ERP Supabase (Prisma is DB_DISABLED=1 in production)
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const VALID_STATUSES = ['PLACED','CONFIRMED','PICKING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED'];

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Order Placed', CONFIRMED: 'Confirmed', PICKING: 'Picking Items',
  OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Try orders table first, then sales_orders
    const res = await fetch(`${SB}/rest/v1/orders?id=eq.${id}&select=*&limit=1`, { headers: H, cache: 'no-store' });
    if (res.ok) {
      const rows = await res.json() as unknown[];
      if (rows.length > 0) return NextResponse.json({ order: rows[0] });
    }
    // Fallback to sales_orders
    const res2 = await fetch(`${SB}/rest/v1/sales_orders?id=eq.${id}&select=*&limit=1`, { headers: H, cache: 'no-store' });
    if (res2.ok) {
      const rows2 = await res2.json() as unknown[];
      if (rows2.length > 0) return NextResponse.json({ order: rows2[0] });
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
