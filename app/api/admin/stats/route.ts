import { NextResponse } from 'next/server';

export const revalidate = 30;

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' };

async function count(table: string, filter = '') {
  const url = `${SB}/rest/v1/${table}?select=id${filter ? '&' + filter : ''}`;
  const res = await fetch(url, { headers: H, cache: 'no-store' });
  const range = res.headers.get('content-range');
  return range ? parseInt(range.split('/')[1] ?? '0', 10) : 0;
}

export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalProducts, outOfStock, totalOrders, pendingOrders, totalUsers, recentOrders, revenueRes] = await Promise.all([
      count('products'),
      count('products', 'in_stock=eq.false'),
      count('orders'),
      count('orders', 'status=eq.PLACED'),
      count('users'),
      count('orders', `created_at=gte.${sevenDaysAgo}`),
      fetch(`${SB}/rest/v1/orders?status=neq.CANCELLED&select=total`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store',
      }),
    ]);

    const orders: any[] = await revenueRes.json();
    const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);

    return NextResponse.json({
      data: {
        products: totalProducts, outOfStock, inStock: totalProducts - outOfStock,
        orders: totalOrders, pendingOrders, recentOrders, users: totalUsers,
        totalRevenue,
      },
      error: null,
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    return NextResponse.json({
      data: { products: 0, outOfStock: 0, inStock: 0, orders: 0, pendingOrders: 0, recentOrders: 0, users: 0, totalRevenue: 0 },
      error: null,
    });
  }
}
