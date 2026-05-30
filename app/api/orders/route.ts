import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

const headers = (extra?: Record<string, string>) => ({
  apikey: KEY, Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json', ...extra,
});

const addressSchema = z.object({
  fullName: z.string().min(2), phone: z.string().min(10),
  line1: z.string().min(5), city: z.string().min(2),
  state: z.string().min(2), pincode: z.string().min(6).max(6),
});

const createOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  paymentMethod: z.enum(['COD', 'RAZORPAY']).default('COD'),
  address: addressSchema, couponCode: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as { id?: string })?.id;
    const clientUserId = req.headers.get('x-user-id');

    if (clientUserId && sessionUserId && clientUserId !== sessionUserId)
      return NextResponse.json({ data: [], error: 'Session mismatch — please log in again' }, { status: 401 });

    const userId = sessionUserId ?? clientUserId ?? null;
    if (!userId) return NextResponse.json({ data: [], error: 'Not authenticated' }, { status: 401 });

    const res = await fetch(
      `${SB}/rest/v1/orders?user_id=eq.${userId}&order=created_at.desc&limit=50&select=*,order_items(*,products(name,image_urls,unit,slug)),addresses(*)`,
      { headers: headers(), cache: 'no-store' }
    );
    const orders: any[] = await res.json();

    const formatted = orders.map((o) => ({
      id: o.id, orderNumber: o.order_number, status: o.status,
      paymentStatus: o.payment_status, paymentMethod: o.payment_method,
      subtotal: o.subtotal, deliveryFee: o.delivery_fee, total: o.total,
      createdAt: o.created_at, address: o.addresses,
      items: (o.order_items ?? []).map((item: any) => {
        let imgs: string[] = [];
        try { imgs = JSON.parse(item.products?.image_urls ?? '[]'); } catch {}
        return {
          id: item.id, name: item.products?.name, unit: item.products?.unit,
          slug: item.products?.slug, imageUrls: imgs,
          quantity: item.quantity, unitPrice: item.unit_price,
        };
      }),
    }));

    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ data: [], error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });

    const { items, paymentMethod, address } = parsed.data;

    // Fetch product prices
    const productIds = items.map((i) => i.productId);
    const prodsRes = await fetch(
      `${SB}/rest/v1/products?id=in.(${productIds.map(id => `"${id}"`).join(',')})&select=id,name,price,in_stock`,
      { headers: headers(), cache: 'no-store' }
    );
    const products: any[] = await prodsRes.json();

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      return NextResponse.json({ error: 'Some items are no longer available. Please refresh your cart.', missingIds: missing }, { status: 422 });
    }

    const priceMap: Record<string, number> = {};
    for (const p of products) priceMap[p.id] = p.price;

    const subtotal = items.reduce((s, i) => s + (priceMap[i.productId] ?? 0) * i.quantity, 0);
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const total = subtotal + deliveryFee;
    const orderNumber = 'FF' + Date.now().toString().slice(-8);

    // Create address
    const addrRes = await fetch(`${SB}/rest/v1/addresses`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify({
        user_id: userId, label: address.fullName.trim() || 'Order Address',
        line1: address.line1, city: address.city, state: address.state,
        pincode: address.pincode, lat: 0, lng: 0, is_default: false,
      }),
    });
    const addrRows: any[] = await addrRes.json();
    const newAddress = addrRows[0];

    // Create order
    const orderRes = await fetch(`${SB}/rest/v1/orders`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify({
        order_number: orderNumber, user_id: userId, address_id: newAddress.id,
        dark_store_id: 'default-store', status: 'PLACED',
        payment_method: paymentMethod, payment_status: 'PENDING',
        subtotal, delivery_fee: deliveryFee, total,
      }),
    });
    const orderRows: any[] = await orderRes.json();
    const order = orderRows[0];

    // Create order items
    await fetch(`${SB}/rest/v1/order_items`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(
        items.map((i) => ({
          order_id: order.id, product_id: i.productId,
          quantity: i.quantity, unit_price: priceMap[i.productId] ?? 0,
          total: (priceMap[i.productId] ?? 0) * i.quantity,
        }))
      ),
    });

    return NextResponse.json({ order: { ...order, items: [] } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}
