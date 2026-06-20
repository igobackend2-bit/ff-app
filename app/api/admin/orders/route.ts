// Admin: List all orders — reads from ERP Supabase (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://qwiumswrbddwmlraktvy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

async function sbGet(path: string) {
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
    let qs = `sales_orders?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    if (status) qs += `&status=eq.${status}`;
    if (search) qs += `&or=(id.ilike.*${search}*,customer_name.ilike.*${search}*)`;

    const { data: orders, total } = await sbGet(qs);

    // Normalise to what the admin UI expects
    const formatted = (Array.isArray(orders) ? orders : []).map((o: Record<string, unknown>) => ({
      id: o['id'],
      orderNumber: o['notes'] ? String(o['notes']).split('·')[0]?.replace('Order','').trim() : String(o['id']).slice(0,8),
      status: o['status'] ?? 'PLACED',
      total: Number(o['total_amount'] ?? 0),
      createdAt: o['created_at'],
      paymentMethod: o['notes'] ? String(o['notes']).split('Payment:')[1]?.trim() ?? 'COD' : 'COD',
      user: {
        name: o['customer_name'] ?? 'Customer',
        phone: '',
      },
      address: o['delivery_address'] ? { line1: String(o['delivery_address']) } : null,
      items: [],
    }));

    return NextResponse.json({ orders: formatted, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/orders GET]', err);
    // Return empty list rather than error so admin UI shows "no orders" not crash
    return NextResponse.json({ orders: [], total: 0, page: 1, pages: 0 });
  }
}
