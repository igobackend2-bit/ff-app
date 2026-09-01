// Public: fresh stock check for a single product — reads Supabase directly so
// admin's "Out of Stock" toggle is reflected immediately (Prisma is offline in prod).
// GET /api/products/stock?productId=xxx  →  { qty: number | null, inStock: boolean }
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) return NextResponse.json({ qty: null, inStock: true }, { status: 400 });

    // select=* — earlier this listed columns (stock_quantity/quantity) that don't
    // exist, so PostgREST 400'd and the route fell back to inStock:true.
    const r = await fetch(
      `${SB}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=*&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' }, cache: 'no-store' },
    );
    if (!r.ok) return NextResponse.json({ qty: null, inStock: true });

    const rows = (await r.json()) as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) return NextResponse.json({ qty: null, inStock: true });

    const inStock = row['in_stock'] !== false;
    const rawQty  = row['stock_left'] ?? row['stock_quantity'] ?? row['quantity'] ?? row['stock'];
    const qty     = rawQty == null ? null : Number(rawQty);

    return NextResponse.json({ qty: inStock ? qty : 0, inStock });
  } catch (err) {
    console.error('[GET /api/products/stock]', err);
    return NextResponse.json({ qty: null, inStock: true }, { status: 500 });
  }
}
