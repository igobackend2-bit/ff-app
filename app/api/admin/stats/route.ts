import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const LEGACY_API = 'https://ff-app-pi.vercel.app/api';

export const revalidate = 30;

async function sbCount(table: string, filter = '') {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return 0;
  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set('select', 'id');
    if (filter) filter.split('&').forEach((f) => {
      const [k, v] = f.split('=');
      if (k && v) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Prefer: 'count=exact' },
      cache: 'no-store',
    });
    const range = res.headers.get('content-range');
    return range ? parseInt(range.split('/')[1] ?? '0', 10) : 0;
  } catch { return 0; }
}

export async function GET() {
  try {
    const [orders, pendingOrders, productsRes] = await Promise.all([
      sbCount('orders'),
      sbCount('orders', 'status=eq.PLACED'),
      fetch(`${LEGACY_API}/products?limit=1`, { cache: 'no-store' }).then((r) => r.json()).catch(() => ({ total: 0 })),
    ]);

    const products = (productsRes as { total?: number }).total ?? 0;

    return NextResponse.json({
      data: {
        products,
        outOfStock: 0,
        inStock: products,
        orders,
        pendingOrders,
        recentOrders: orders,
        users: 0,
        totalRevenue: 0,
      },
      error: null,
    });
  } catch (err) {
    console.error('[admin/stats GET]', err);
    return NextResponse.json({
      data: { products: 0, outOfStock: 0, inStock: 0, orders: 0, pendingOrders: 0, recentOrders: 0, users: 0, totalRevenue: 0 },
      error: null,
    });
  }
}
