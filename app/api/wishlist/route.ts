import { NextRequest, NextResponse } from 'next/server';

// Self-contained wishlist store. Keys off the session user id (a "phone:+91…"
// string for OTP users), so the column must be TEXT. Uses the service-role key
// to bypass RLS. Falls back gracefully and surfaces the real error for debugging.
const SB  = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' };

// customer_wishlists (phone text, product_id text) — created via SQL, RLS off.
const TABLE = 'customer_wishlists';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ data: [], error: null });
  try {
    const r = await fetch(
      `${SB}/rest/v1/${TABLE}?user_key=eq.${encodeURIComponent(userId)}` +
      `&select=product_id,products(id,name,slug,price,mrp,unit,image_url,image_urls,in_stock,average_rating,is_featured)` +
      `&order=created_at.desc`,
      { headers: H, cache: 'no-store' },
    );
    if (!r.ok) { console.warn('[wishlist GET]', r.status, (await r.text()).slice(0, 200)); return NextResponse.json({ data: [], error: null }); }
    const rows = await r.json() as Array<Record<string, unknown>>;
    return NextResponse.json({ data: rows, error: null });
  } catch (err) {
    console.error('[wishlist GET]', err);
    return NextResponse.json({ data: [], error: null });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 });
  try {
    const { productId } = (await req.json()) as { productId: string };
    const r = await fetch(`${SB}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_key: userId, product_id: productId }),
      cache: 'no-store',
    });
    if (!r.ok) {
      const t = (await r.text()).slice(0, 250);
      console.warn('[wishlist POST]', r.status, t);
      return NextResponse.json({ data: null, error: t }, { status: 502 });
    }
    return NextResponse.json({ data: { added: true }, error: null });
  } catch (err) {
    console.error('[wishlist POST]', err);
    return NextResponse.json({ data: null, error: String(err).slice(0, 200) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 });
  try {
    const { productId } = (await req.json()) as { productId: string };
    const r = await fetch(
      `${SB}/rest/v1/${TABLE}?user_key=eq.${encodeURIComponent(userId)}&product_id=eq.${encodeURIComponent(productId)}`,
      { method: 'DELETE', headers: H, cache: 'no-store' },
    );
    if (!r.ok) return NextResponse.json({ data: null, error: (await r.text()).slice(0, 200) }, { status: 502 });
    return NextResponse.json({ data: { removed: true }, error: null });
  } catch (err) {
    console.error('[wishlist DELETE]', err);
    return NextResponse.json({ data: null, error: String(err).slice(0, 200) }, { status: 500 });
  }
}
