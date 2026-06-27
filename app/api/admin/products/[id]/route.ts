// Admin: Get / Update single product — reads/writes ERP Supabase (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

function parseImageUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as string[]; } catch { return raw ? [raw] : []; }
  }
  return [];
}

function mapRow(r: Record<string, unknown>) {
  return {
    id:            r['id'],
    name:          r['name']            ?? '',
    slug:          r['slug']            ?? '',
    description:   r['description']     ?? '',
    price:         Number(r['price']    ?? 0),
    mrp:           Number(r['mrp']      ?? r['price'] ?? 0),
    unit:          r['unit']            ?? '',
    inStock:       r['in_stock']        !== false,
    isFeatured:    Boolean(r['is_featured']),
    tags:          Array.isArray(r['tags']) ? r['tags'] : [],
    imageUrls:     parseImageUrls(r['image_urls'] ?? r['imageUrls']),
    averageRating: Number(r['average_rating'] ?? r['averageRating'] ?? 0),
    reviewCount:   Number(r['review_count']   ?? r['reviewCount']   ?? 0),
    category: r['category_name']
      ? { name: String(r['category_name']), slug: String(r['category_slug'] ?? '') }
      : null,
    brand: r['brand_name'] ? { name: String(r['brand_name']), slug: '' } : null,
  };
}

// GET /api/admin/products/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const res = await fetch(
      `${SB}/rest/v1/products?id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: H, cache: 'no-store' },
    );
    if (!res.ok) throw new Error(await res.text());
    const rows: Record<string, unknown>[] = await res.json();
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product: mapRow(rows[0]) });
  } catch (err) {
    console.error('[admin/products/:id GET]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/admin/products/[id] — updates ERP Supabase → instantly reflects in app/APK
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;

    // Map camelCase from UI → snake_case for Supabase
    const patch: Record<string, unknown> = {};
    if (body['name']          !== undefined) patch['name']           = body['name'];
    if (body['description']   !== undefined) patch['description']    = body['description'];
    if (body['price']         !== undefined) patch['price']          = Number(body['price']);
    if (body['mrp']           !== undefined) patch['mrp']            = Number(body['mrp']);
    if (body['unit']          !== undefined) patch['unit']           = body['unit'];
    if (body['tags']          !== undefined) patch['tags']           = body['tags'];
    if (body['imageUrls']     !== undefined) patch['image_urls']     = body['imageUrls'];
    if (body['inStock']       !== undefined) patch['in_stock']       = Boolean(body['inStock']);
    if (body['isFeatured']    !== undefined) patch['is_featured']    = Boolean(body['isFeatured']);
    if (body['averageRating'] !== undefined) patch['average_rating'] = Number(body['averageRating']);
    if (body['reviewCount']   !== undefined) patch['review_count']   = Number(body['reviewCount']);
    if (body['sortOrder']     !== undefined) patch['sort_order']     = Number(body['sortOrder']);

    const res = await fetch(
      `${SB}/rest/v1/products?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(patch), cache: 'no-store' },
    );
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }
    return NextResponse.json({ product: { id } });
  } catch (err) {
    console.error('[admin/products/:id PATCH]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
