// Admin: List all orders — reads from Supabase REST (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

async function sbGet(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase not configured');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Accept: 'application/json',
      Prefer: 'count=exact',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const countHeader = res.headers.get('content-range');
  const total = countHeader ? parseInt(countHeader.split('/')[1] ?? '0', 10) : (Array.isArray(data) ? data.length : 0);
  return { data, total };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const status = searchParams.get('status') ?? '';
    const search = searchParams.get('q') ?? '';

    const offset = (page - 1) * limit;
    let qs = `orders?select=*,order_items(*)&order=created_at.desc&limit=${limit}&offset=${offset}`;
    if (status) qs += `&status=eq.${status}`;
    if (search) qs += `&or=(id.ilike.*${search}*,customer_name.ilike.*${search}*)`;

    const { data: orders, total } = await sbGet(qs);

    // Normalise to what the admin UI expects
    const formatted = (Array.isArray(orders) ? orders : []).map((o: Record<string, unknown>) => ({
      id: o['id'],
      orderNumber: o['order_number'] ?? o['id'],
      status: o['status'] ?? 'PLACED',
      total: o['total'] ?? 0,
      createdAt: o['created_at'],
      paymentMethod: o['payment_method'] ?? 'COD',
      user: {
        name: o['customer_name'] ?? 'Customer',
        phone: o['customer_phone'] ?? '',
      },
      address: o['delivery_address'] ? { line1: o['delivery_address'] } : null,
      items: Array.isArray(o['order_items']) ? o['order_items'].map((i: Record<string, unknown>) => ({
        id: i['id'],
        quantity: i['quantity'],
        unitPrice: i['unit_price'] ?? 0,
        product: { name: i['product_name'] ?? 'Product', imageUrls: i['image_url'] ? [i['image_url']] : [] },
      })) : [],
    }));

    return NextResponse.json({ orders: formatted, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/orders GET]', err);
    // Return empty list rather than error so admin UI shows "no orders" not crash
    return NextResponse.json({ orders: [], total: 0, page: 1, pages: 0 });
  }
}
