import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const STORE_ID = 'main-store';

export async function PATCH(req: NextRequest) {
  try {
    const { productId, quantity, threshold } = await req.json() as { productId: string; quantity: number; threshold?: number };
    if (!productId || quantity === undefined) return NextResponse.json({ error: 'productId and quantity required' }, { status: 400 });

    // Upsert inventory record
    const existing = await fetch(`${SB}/rest/v1/inventory?product_id=eq.${productId}&dark_store_id=eq.${STORE_ID}&limit=1`, { headers: H, cache: 'no-store' });
    const rows: any[] = await existing.json();

    let result;
    if (rows.length) {
      const patch: any = { quantity };
      if (threshold !== undefined) patch.threshold = threshold;
      const res = await fetch(`${SB}/rest/v1/inventory?product_id=eq.${productId}&dark_store_id=eq.${STORE_ID}`, {
        method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(patch),
      });
      result = (await res.json())[0];
    } else {
      const res = await fetch(`${SB}/rest/v1/inventory`, {
        method: 'POST', headers: { ...H, Prefer: 'return=representation' },
        body: JSON.stringify({ product_id: productId, dark_store_id: STORE_ID, quantity, threshold: threshold ?? 10 }),
      });
      result = (await res.json())[0];
    }

    // Update product inStock flag
    await fetch(`${SB}/rest/v1/products?id=eq.${productId}`, {
      method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ in_stock: quantity > 0 }),
    });

    return NextResponse.json({ inventory: result });
  } catch (err) {
    console.error('[admin/inventory/update]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
