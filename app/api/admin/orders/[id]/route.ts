import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const VALID_STATUSES = ['PLACED', 'CONFIRMED', 'PICKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(
      `${SB}/rest/v1/orders?id=eq.${id}&limit=1&select=*,users(id,name,phone),order_items(*,products(*)),addresses(*)`,
      { headers: H, cache: 'no-store' }
    );
    const rows: any[] = await res.json();
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const o = rows[0];
    return NextResponse.json({
      order: {
        ...o, orderNumber: o.order_number, userId: o.user_id,
        paymentStatus: o.payment_status, paymentMethod: o.payment_method,
        deliveryFee: o.delivery_fee, createdAt: o.created_at, updatedAt: o.updated_at,
        user: o.users, address: o.addresses,
        items: (o.order_items ?? []).map((item: any) => ({
          ...item, unitPrice: item.unit_price, orderId: item.order_id, productId: item.product_id,
          product: item.products,
        })),
      }
    });
  } catch (err) {
    console.error('[admin/orders/:id GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json() as { status: string };
    if (!VALID_STATUSES.includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const res = await fetch(`${SB}/rest/v1/orders?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify({ status, ...(status === 'DELIVERED' && { payment_status: 'PAID', delivered_at: new Date().toISOString() }) }),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ order: rows[0] });
  } catch (err) {
    console.error('[admin/orders/:id PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
