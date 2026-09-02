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
    // 1. product ids saved for this user (no FK embed — customer_wishlists has none)
    const idRes = await fetch(
      `${SB}/rest/v1/${TABLE}?user_key=eq.${encodeURIComponent(userId)}&select=product_id&order=created_at.desc`,
      { headers: H, cache: 'no-store' },
    );
    if (!idRes.ok) { console.warn('[wishlist GET ids]', idRes.status, (await idRes.text()).slice(0, 200)); return NextResponse.json({ data: [], error: null }); }
    const ids = (await idRes.json() as Array<{ product_id: string }>).map((x) => x.product_id).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ data: [], error: null });

    // 2. hydrate the products.
    // Saved product_id may be a real uuid OR a slug/synthetic id (the app's
    // resolver/dedup layer can hand cards a non-uuid id). Mixing a non-uuid into
    // `id=in.(...)` makes PostgREST 400 the WHOLE query → every item vanishes.
    // So split by shape and look each group up by the right column.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuidIds = ids.filter((id) => UUID_RE.test(id));
    const slugIds = ids.filter((id) => !UUID_RE.test(id));
    const SELECT = 'select=id,name,slug,price,mrp,unit,image_url,image_urls,in_stock,average_rating,is_featured';

    const products: Array<Record<string, unknown>> = [];
    const pull = async (url: string) => {
      const r = await fetch(url, { headers: H, cache: 'no-store' });
      if (r.ok) { const rows = await r.json() as Array<Record<string, unknown>>; products.push(...rows); }
      else console.warn('[wishlist GET hydrate]', r.status, (await r.text()).slice(0, 160));
    };
    if (uuidIds.length) {
      await pull(`${SB}/rest/v1/products?id=in.(${uuidIds.map(encodeURIComponent).join(',')})&${SELECT}`);
    }
    if (slugIds.length) {
      await pull(`${SB}/rest/v1/products?slug=in.(${slugIds.map(encodeURIComponent).join(',')})&${SELECT}`);
    }

    // Match back to each saved id by uuid OR slug; preserve the wishlist order.
    const byUuid = new Map(products.map((p) => [String(p['id']), p]));
    const bySlug = new Map(products.map((p) => [String(p['slug']), p]));
    const data = ids
      .map((id) => byUuid.get(id) ?? bySlug.get(id))
      .filter(Boolean)
      .map((p) => ({ product_id: (p as any).id, products: p }));
    return NextResponse.json({ data, error: null });
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
      headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
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
