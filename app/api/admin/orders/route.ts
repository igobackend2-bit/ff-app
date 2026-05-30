import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit  = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const status = searchParams.get('status') ?? '';
    const offset = (page - 1) * limit;

    const filters: string[] = [];
    if (status) filters.push(`status=eq.${encodeURIComponent(status)}`);
    const filterStr = filters.length ? filters.join('&') + '&' : '';

    const [dataRes, countRes] = await Promise.all([
      fetch(`${SB}/rest/v1/orders?${filterStr}order=created_at.desc&limit=${limit}&offset=${offset}&select=*,users(id,name,phone),order_items(*,products(name,image_urls)),addresses(*)`,
        { headers: H, cache: 'no-store' }),
      fetch(`${SB}/rest/v1/orders?${filterStr}select=id`,
        { headers: { ...H, Prefer: 'count=exact' }, cache: 'no-store' }),
    ]);

    const orders: any[] = await dataRes.json();
    const range = countRes.headers.get('content-range');
    const total = range ? parseInt(range.split('/')[1] ?? '0', 10) : orders.length;

    const formatted = orders.map((o) => ({
      ...o,
      orderNumber: o.order_number, userId: o.user_id, addressId: o.address_id,
      paymentStatus: o.payment_status, paymentMethod: o.payment_method,
      deliveryFee: o.delivery_fee, couponCode: o.coupon_code,
      createdAt: o.created_at, updatedAt: o.updated_at,
      user: o.users ?? null, address: o.addresses ?? null,
      items: (o.order_items ?? []).map((item: any) => ({
        ...item,
        unitPrice: item.unit_price, orderId: item.order_id, productId: item.product_id,
        product: item.products ? {
          name: item.products.name,
          imageUrls: (() => { try { return JSON.parse(item.products.image_urls ?? '[]'); } catch { return []; } })(),
        } : null,
      })),
    }));

    return NextResponse.json({ orders: formatted, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/orders GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
