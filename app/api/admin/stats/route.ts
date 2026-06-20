import { NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

export const dynamic = 'force-dynamic';

async function sbCount(table: string, filter = '') {
  try {
    const url = new URL(`${SB}/rest/v1/${table}`);
    url.searchParams.set('select', 'id');
    if (filter) filter.split('&').forEach((f) => {
      const [k, v] = f.split('=');
      if (k && v) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' },
      cache: 'no-store',
    });
    const range = res.headers.get('content-range');
    return range ? parseInt(range.split('/')[1] ?? '0', 10) : 0;
  } catch { return 0; }
}

export async function GET() {
  try {
    const [orders, pendingOrders, products] = await Promise.all([
      sbCount('sales_orders'),
      sbCount('sales_orders', 'status=eq.PLACED'),
      sbCount('products'),
    ]);

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
