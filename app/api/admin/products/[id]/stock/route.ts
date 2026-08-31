// Admin: Toggle product stock status (in-stock / out-of-stock)
// Writes to Supabase with the service-role key. A DB trigger on `products`
// re-derives `in_stock` from a quantity column, so setting `in_stock` alone
// reverts — we also set every quantity-like column that actually exists.
import { NextRequest, NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';

// `stock_left` is the real column a DB trigger derives `in_stock` from.
const QTY_RE = /^(stock_left|stock_quantity|quantity|stock|available_quantity|available_stock|inventory|qty|stock_count)$/i;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const inStock = Boolean(body.inStock);

    // 1. Discover which columns this row actually has.
    const cur = await sbAdmin<Array<Record<string, unknown>>>('products', {
      query: `id=eq.${encodeURIComponent(id)}&select=*`,
    });
    const row0 = Array.isArray(cur.data) ? cur.data[0] : null;
    if (!row0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const patch: Record<string, unknown> = { in_stock: inStock };
    for (const key of Object.keys(row0)) {
      if (QTY_RE.test(key)) patch[key] = inStock ? 100 : 0;
    }

    const r = await sbAdmin<Array<Record<string, unknown>>>('products', {
      method: 'PATCH',
      query: `id=eq.${encodeURIComponent(id)}`,
      body: patch,
      prefer: 'return=representation',
    });

    const after = Array.isArray(r.data) ? r.data[0] : null;
    console.warn('[stock PATCH]', id, '-> req', inStock, '| patched', Object.keys(patch).join(','),
      '| status', r.status, '| now in_stock =', after?.['in_stock']);

    if (!r.ok) return NextResponse.json({ error: r.text.slice(0, 200) }, { status: 502 });

    return NextResponse.json({
      product: { id, name: after?.['name'] ?? row0['name'] ?? '', inStock: after?.['in_stock'] !== false },
      patched: Object.keys(patch),
      matched: Array.isArray(r.data) ? r.data.length : 0,
    });
  } catch (err) {
    console.error('[admin/products/:id/stock PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
