import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

function fmtProduct(p: any) {
  return {
    ...p,
    imageUrls:    (() => { try { return JSON.parse(p.image_urls ?? '[]'); } catch { return []; } })(),
    blurDataUrls: (() => { try { return JSON.parse(p.blur_data_urls ?? '[]'); } catch { return []; } })(),
    tags:         (() => { try { return JSON.parse(p.tags ?? '[]'); } catch { return []; } })(),
    categoryId: p.category_id, brandId: p.brand_id,
    isFeatured: p.is_featured, isActive: p.is_active, inStock: p.in_stock,
    averageRating: p.average_rating, reviewCount: p.review_count, sortOrder: p.sort_order,
    createdAt: p.created_at, updatedAt: p.updated_at,
    brand: p.brands ?? null, category: p.categories ?? null,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(`${SB}/rest/v1/products?id=eq.${id}&limit=1&select=*,categories(id,name,slug),brands(id,name,slug)`,
      { headers: H, cache: 'no-store' });
    const rows: any[] = await res.json();
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product: fmtProduct(rows[0]) });
  } catch (err) {
    console.error('[admin/products/:id GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const patch: any = {};
    if (body.name        !== undefined) patch.name         = body.name;
    if (body.description !== undefined) patch.description  = body.description;
    if (body.price       !== undefined) patch.price        = Number(body.price);
    if (body.mrp         !== undefined) patch.mrp          = Number(body.mrp);
    if (body.unit        !== undefined) patch.unit         = body.unit;
    if (body.tags        !== undefined) patch.tags         = JSON.stringify(body.tags);
    if (body.imageUrls   !== undefined) patch.image_urls   = JSON.stringify(body.imageUrls);
    if (body.blurDataUrls !== undefined) patch.blur_data_urls = JSON.stringify(body.blurDataUrls);
    if (body.inStock     !== undefined) patch.in_stock     = Boolean(body.inStock);
    if (body.isFeatured  !== undefined) patch.is_featured  = Boolean(body.isFeatured);
    if (body.averageRating !== undefined) patch.average_rating = Math.min(5, Math.max(0, Number(body.averageRating)));
    if (body.reviewCount !== undefined) patch.review_count = Math.max(0, Math.round(Number(body.reviewCount)));
    if (body.sortOrder   !== undefined) patch.sort_order   = Number(body.sortOrder);

    const res = await fetch(`${SB}/rest/v1/products?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ product: fmtProduct(rows[0]) });
  } catch (err) {
    console.error('[admin/products/:id PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await fetch(`${SB}/rest/v1/products?id=eq.${id}`, { method: 'DELETE', headers: H });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/products/:id DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
