import { NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';

// TEMP: create a real multi-item order + read it back via the same shape /api/orders and track use.
export async function GET() {
  const orderNumber = 'FF-DIAG' + String(Date.now()).slice(-4);
  const P1 = '5c47971d-c2a6-4d52-b8c3-eca78e4743f3'; // Guava White
  const P2 = '731e205d-fc22-4481-ba8f-afcf48e08c2d'; // Sweet Corn

  const ins = await sbAdmin<any[]>('orders', {
    method: 'POST',
    body: {
      user_id: 'phone:+910000000000', order_number: orderNumber,
      customer_name: 'Diag', customer_phone: '0000000000',
      subtotal: 300, delivery_fee: 0, total_amount: 300, total: 300,
      delivery_address: 'Diag\n0000000000\nTest, Chennai, TN - 600001',
      delivery_pincode: '600001', payment_method: 'cod',
      payment_status: 'unpaid', status: 'PLACED', source: 'diag',
    },
    prefer: 'return=representation',
  });
  const order = Array.isArray(ins.data) ? ins.data[0] : null;
  if (!order?.id) return NextResponse.json({ step: 'order insert', status: ins.status, body: ins.text.slice(0, 300) });

  const items = [
    { order_id: order.id, product_id: P1, quantity: 2, unit_price: 90, total: 180 },
    { order_id: order.id, product_id: P2, quantity: 3, unit_price: 40, total: 120 },
  ];
  const results: any[] = [];
  for (const it of items) {
    const r = await sbAdmin('order_items', { method: 'POST', body: it, prefer: 'return=minimal' });
    results.push({ product: it.product_id, status: r.status, body: r.text.slice(0, 150) });
  }

  // read back
  const read = await sbAdmin<any[]>('order_items', {
    query: `order_id=eq.${order.id}&select=product_id,quantity,unit_price,products(name)`,
  });

  // cleanup
  await sbAdmin('order_items', { method: 'DELETE', query: `order_id=eq.${order.id}` });
  await sbAdmin('orders', { method: 'DELETE', query: `id=eq.${order.id}` });

  return NextResponse.json({
    orderNumber, orderId: order.id,
    inserts: results,
    read_back: read.data,
  });
}
