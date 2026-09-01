import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';

// TEMP diagnostics — inspect order_items schema + a round-trip insert.
export async function GET() {
  const out: Record<string, unknown> = {};

  // 1. order_items columns (via an existing row)
  const anyItem = await sbAdmin<any[]>('order_items', { query: 'select=*&limit=1' });
  out['order_items_columns'] = Array.isArray(anyItem.data) && anyItem.data[0]
    ? Object.keys(anyItem.data[0]) : `status ${anyItem.status}: ${anyItem.text.slice(0, 200)}`;

  // 2. how many order_items exist total
  const cnt = await sbAdmin<any[]>('order_items', { query: 'select=id&limit=1', prefer: 'count=exact' });
  out['order_items_sample'] = cnt.data;

  // 3. round-trip: insert an item for a known order, read it back, delete it
  const testOrderId = 'diag-' + Date.now();
  const ins = await sbAdmin<any[]>('order_items', {
    method: 'POST',
    body: { order_id: testOrderId, product_id: '5c47971d-c2a6-4d52-b8c3-eca78e4743f3', quantity: 1, unit_price: 90, total: 90 },
    prefer: 'return=representation',
  });
  out['insert_status'] = ins.status;
  out['insert_body'] = ins.text.slice(0, 300);
  if (ins.ok) {
    await sbAdmin('order_items', { method: 'DELETE', query: `order_id=eq.${testOrderId}` });
  }

  return NextResponse.json(out);
}
