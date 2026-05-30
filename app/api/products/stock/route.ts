import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) return NextResponse.json({ qty: null }, { status: 400 });

    const res = await fetch(
      `${SB}/rest/v1/products?id=eq.${productId}&select=in_stock&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }
    );
    const rows: any[] = await res.json();
    if (!rows.length) return NextResponse.json({ qty: null });
    // Return null (unlimited) if in_stock, 0 if out of stock
    return NextResponse.json({ qty: rows[0].in_stock ? null : 0 });
  } catch {
    return NextResponse.json({ qty: null });
  }
}
