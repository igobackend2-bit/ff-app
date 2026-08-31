// Admin: Toggle product stock status (in-stock / out-of-stock)
// Writes to Supabase `products.in_stock` with the service-role key — the old
// Prisma path was a no-op in production (DB_DISABLED), so toggles never stuck.
import { NextRequest, NextResponse } from 'next/server';
import { sbAdmin } from '@/lib/sb-admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const inStock = Boolean(body.inStock);

    const r = await sbAdmin<Array<Record<string, unknown>>>('products', {
      method: 'PATCH',
      query: `id=eq.${encodeURIComponent(id)}`,
      body: { in_stock: inStock },
      prefer: 'return=representation',
    });

    const _row0 = Array.isArray(r.data) ? (r.data[0] as Record<string, unknown>) : null;
    console.warn('[stock PATCH]', id, '-> req', inStock, '| status', r.status,
      '| returned in_stock =', _row0?.['in_stock'], '| keys:', _row0 ? Object.keys(_row0).join(',') : 'none');
    if (!r.ok) {
      return NextResponse.json({ error: 'Could not update stock' }, { status: 502 });
    }

    const row = Array.isArray(r.data) ? r.data[0] : null;
    return NextResponse.json({ product: { id, name: row?.['name'] ?? '', inStock }, matched: Array.isArray(r.data) ? r.data.length : 0 });
  } catch (err) {
    console.error('[admin/products/:id/stock PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
