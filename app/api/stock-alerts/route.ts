// Back-in-stock alerts.
//  POST  { productId }  + header x-user-id   → register the current user's alert
//  GET   (admin)                             → list pending alerts grouped by product
import { NextRequest, NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';

const TABLE = 'stock_alerts';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userKey = req.headers.get('x-user-id');
  if (!userKey) return NextResponse.json({ error: 'Sign in to get notified' }, { status: 401 });
  try {
    const { productId } = (await req.json()) as { productId?: string };
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    const phone = userKey.startsWith('phone:') ? userKey.slice(6) : null;
    const r = await sbAdmin(TABLE, {
      method: 'POST',
      body: { product_id: productId, user_key: userKey, phone, notified: false },
      prefer: 'resolution=merge-duplicates,return=minimal',
    });
    if (!r.ok) {
      console.warn('[stock-alerts POST]', r.status, r.text.slice(0, 200));
      return NextResponse.json({ error: r.text.slice(0, 200) }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err).slice(0, 200) }, { status: 500 });
  }
}

export async function GET() {
  const r = await sbAdmin<Array<Record<string, unknown>>>(TABLE, {
    query: 'notified=eq.false&select=product_id,user_key,phone,created_at,products(name)&order=created_at.desc&limit=500',
  });
  const rows = Array.isArray(r.data) ? r.data : [];
  const byProduct: Record<string, { productId: string; name: string; count: number; users: string[] }> = {};
  for (const a of rows) {
    const pid = String(a['product_id']);
    (byProduct[pid] ??= {
      productId: pid,
      name: String((a['products'] as any)?.name ?? pid),
      count: 0,
      users: [],
    });
    byProduct[pid].count++;
    byProduct[pid].users.push(String(a['phone'] ?? a['user_key']));
  }
  return NextResponse.json({ total: rows.length, products: Object.values(byProduct) });
}
