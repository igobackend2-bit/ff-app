// Admin: List all orders — reads from ERP Supabase (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://qwiumswrbddwmlraktvy.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

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
    // Read the real `orders` table — it has order_number, payment fields AND line items.
    let qs = `orders?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    if (status) qs += `&status=eq.${status}`;
    if (search) qs += `&or=(order_number.ilike.*${search}*,customer_name.ilike.*${search}*,customer_phone.ilike.*${search}*)`;

    const { data: orders, total } = await sbGet(qs);
    const rows = Array.isArray(orders) ? orders : [];

    // Batch-fetch line items for this page of orders.
    const ids = rows.map((o: Record<string, unknown>) => o['id']).filter(Boolean);
    const itemsByOrder: Record<string, any[]> = {};
    if (ids.length) {
      try {
        const { data: allItems } = await sbGet(
          `order_items?order_id=in.(${ids.join(',')})&select=id,order_id,product_id,quantity,unit_price,total,products(name,unit,image_url,image_urls)`,
        );
        for (const it of (Array.isArray(allItems) ? allItems : [])) {
          const oid = String(it['order_id']);
          const p = (it['products'] ?? {}) as Record<string, unknown>;
          let imgs: string[] = [];
          const iu = p['image_urls'];
          if (Array.isArray(iu)) imgs = iu as string[];
          else if (typeof iu === 'string' && iu.trim()) { try { imgs = JSON.parse(iu); } catch { imgs = [iu]; } }
          if (!imgs.length && typeof p['image_url'] === 'string' && p['image_url']) imgs = [p['image_url'] as string];
          (itemsByOrder[oid] ??= []).push({
            id: it['id'],
            quantity: Number(it['quantity'] ?? 0),
            unitPrice: Number(it['unit_price'] ?? 0),
            product: { name: p['name'] ?? 'Item', unit: p['unit'] ?? '', imageUrls: imgs },
          });
        }
      } catch { /* items unavailable */ }
    }

    const formatted = rows.map((o: Record<string, unknown>) => ({
      id: o['id'],
      orderNumber: o['order_number'] ?? String(o['id']).slice(0, 8),
      status: o['status'] ?? 'PLACED',
      total: Number(o['total_amount'] ?? o['total'] ?? 0),
      subtotal: Number(o['subtotal'] ?? 0),
      deliveryFee: Number(o['delivery_fee'] ?? 0),
      createdAt: o['created_at'],
      paymentMethod: String(o['payment_method'] ?? 'cod').toUpperCase(),
      paymentStatus: o['payment_status'] ?? 'unpaid',
      user: { name: o['customer_name'] ?? 'Customer', phone: o['customer_phone'] ?? '' },
      address: o['delivery_address'] ? { line1: String(o['delivery_address']) } : null,
      items: itemsByOrder[String(o['id'])] ?? [],
    }));

    return NextResponse.json({ orders: formatted, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/orders GET]', err);
    // Return empty list rather than error so admin UI shows "no orders" not crash
    return NextResponse.json({ orders: [], total: 0, page: 1, pages: 0 });
  }
}
