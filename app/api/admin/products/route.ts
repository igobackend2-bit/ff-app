// Admin: List / Create products — reads/writes ERP Supabase (same source as the app)
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'count=exact' };

export const dynamic = 'force-dynamic';

function parseImageUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as string[]; } catch { return raw ? [raw] : []; }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit  = Math.min(100, Number(searchParams.get('limit') ?? 20));
    const search = searchParams.get('q') ?? '';
    const sort   = searchParams.get('sort') ?? '';
    const stock  = searchParams.get('stock') ?? '';
    const offset = (page - 1) * limit;

    let qs = `products?select=*&limit=${limit}&offset=${offset}`;
    if (search) qs += `&or=(name.ilike.*${encodeURIComponent(search)}*,slug.ilike.*${encodeURIComponent(search)}*)`;
    if (stock === 'out') qs += `&in_stock=eq.false`;
    if (sort === 'price-asc')   qs += `&order=price.asc`;
    else if (sort === 'price-desc') qs += `&order=price.desc`;
    else if (sort === 'rating') qs += `&order=average_rating.desc.nullslast`;
    else qs += `&order=created_at.desc`;

    const res = await fetch(`${SB}/rest/v1/${qs}`, { headers: H, cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());

    const rows: Record<string, unknown>[] = await res.json();
    const rangeHeader = res.headers.get('content-range');
    const total = rangeHeader ? parseInt(rangeHeader.split('/')[1] ?? '0', 10) : rows.length;

    const products = rows.map((r) => ({
      id:            r['id'],
      name:          r['name']          ?? '',
      slug:          r['slug']          ?? '',
      unit:          r['unit']          ?? '',
      price:         Number(r['price']  ?? 0),
      mrp:           Number(r['mrp']    ?? r['price'] ?? 0),
      inStock:       r['in_stock']      !== false,
      isFeatured:    Boolean(r['is_featured']),
      imageUrls:     parseImageUrls(r['image_urls'] ?? r['imageUrls']),
      averageRating: Number(r['average_rating'] ?? 0),
      reviewCount:   Number(r['review_count']   ?? 0),
      category:      r['category_name']
        ? { name: String(r['category_name']), slug: String(r['category_slug'] ?? '') }
        : null,
      brand:         r['brand_name'] ? { name: String(r['brand_name']) } : null,
    }));

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/products GET]', err);
    return NextResponse.json({ products: [], total: 0, page: 1, pages: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const row: Record<string, unknown> = {};
    if (body['name']        !== undefined) row['name']          = body['name'];
    if (body['slug']        !== undefined) row['slug']          = body['slug'];
    if (body['description'] !== undefined) row['description']   = body['description'];
    if (body['price']       !== undefined) row['price']         = Number(body['price']);
    if (body['mrp']         !== undefined) row['mrp']           = Number(body['mrp']);
    if (body['unit']        !== undefined) row['unit']          = body['unit'];
    if (body['tags']        !== undefined) row['tags']          = body['tags'];
    if (body['imageUrls']   !== undefined) row['image_urls']    = body['imageUrls'];
    if (body['inStock']     !== undefined) row['in_stock']      = Boolean(body['inStock']);
    if (body['isFeatured']  !== undefined) row['is_featured']   = Boolean(body['isFeatured']);

    const res = await fetch(`${SB}/rest/v1/products`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify(row),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/products POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
