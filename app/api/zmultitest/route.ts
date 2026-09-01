import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';

// TEMP: recent orders + how many order_items each has.
export async function GET() {
  const orders = await sbAdmin<any[]>('orders', {
    query: 'select=id,order_number,total_amount,created_at,status&order=created_at.desc&limit=15',
  });
  const rows = Array.isArray(orders.data) ? orders.data : [];
  const ids = rows.map((o) => o.id);

  const its = await sbAdmin<any[]>('order_items', {
    query: `order_id=in.(${ids.join(',')})&select=order_id,product_id,quantity,products(name)`,
  });
  const byOrder: Record<string, any[]> = {};
  for (const it of (Array.isArray(its.data) ? its.data : [])) {
    (byOrder[it.order_id] ??= []).push(it);
  }

  return NextResponse.json({
    orders: rows.map((o) => ({
      order_number: o.order_number,
      total: o.total_amount,
      created: o.created_at?.slice(0, 16),
      item_count: (byOrder[o.id] ?? []).length,
      items: (byOrder[o.id] ?? []).map((x) => `${x.products?.name ?? x.product_id} x${x.quantity}`),
    })),
  });
}
