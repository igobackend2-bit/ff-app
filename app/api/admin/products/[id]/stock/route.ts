import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { inStock } = await req.json() as { inStock: boolean };
    const res = await fetch(`${SB}/rest/v1/products?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify({ in_stock: Boolean(inStock) }),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ product: rows[0] });
  } catch (err) {
    console.error('[admin/products/:id/stock PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
