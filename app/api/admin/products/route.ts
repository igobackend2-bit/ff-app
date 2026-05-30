import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

function parseJSON(val: any, fallback: any = []) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || '[]'); } catch { return fallback; }
}

function fmtProduct(p: any) {
  return {
    ...p,
    id: p.id, name: p.name, slug: p.slug, description: p.description,
    imageUrls: parseJSON(p.image_urls),
    blurDataUrls: parseJSON(p.blur_data_urls),
    tags: parseJSON(p.tags),
    categoryId: p.category_id, brandId: p.brand_id,
    sku: p.sku, mrp: p.mrp, price: p.price, unit: p.unit,
    isFeatured: p.is_featured, isActive: p.is_active, inStock: p.in_stock,
    averageRating: p.average_rating, reviewCount: p.review_count, sortOrder: p.sort_order,
    createdAt: p.created_at, updatedAt: p.updated_at,
    brand: p.brands ?? null,
    category: p.categories ?? null,
    orderCount: 0,
  };
}

function dedupe(products: any[]): any[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    const key = `${String(p.name).trim().toLowerCase()}||${String(p.unit).trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit  = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const search = searchParams.get('q') ?? '';
    const categorySlug = searchParams.get('category') ?? '';
    const stockFilter  = searchParams.get('stock'); // 'in' | 'out'
    const sortParam    = searchParams.get('sort') ?? '';
    const offset = (page - 1) * limit;

    const filters: string[] = ['is_active=eq.true'];
    if (search)        filters.push(`name=ilike.*${encodeURIComponent(search)}*`);
    if (stockFilter === 'in')  filters.push('in_stock=eq.true');
    if (stockFilter === 'out') filters.push('in_stock=eq.false');

    if (categorySlug) {
      const catRes = await fetch(`${SB}/rest/v1/categories?slug=eq.${encodeURIComponent(categorySlug)}&select=id&limit=1`, { headers: H, cache: 'no-store' });
      const cats: any[] = await catRes.json();
      if (cats[0]?.id) filters.push(`category_id=eq.${cats[0].id}`);
    }

    let order = 'created_at.desc';
    if (sortParam === 'rating')  order = 'average_rating.desc';
    if (sortParam === 'popular') order = 'review_count.desc';
    if (sortParam === 'order')   order = 'sort_order.asc,created_at.desc';

    const filterStr = filters.join('&');

    const [dataRes, countRes] = await Promise.all([
      fetch(`${SB}/rest/v1/products?${filterStr}&order=${order}&limit=${limit * 2}&offset=${offset}&select=*,categories(id,name,slug),brands(id,name,slug)`,
        { headers: H, cache: 'no-store' }),
      fetch(`${SB}/rest/v1/products?${filterStr}&select=id`,
        { headers: { ...H, Prefer: 'count=exact' }, cache: 'no-store' }),
    ]);

    const rows: any[] = await dataRes.json();
    const range = countRes.headers.get('content-range');
    const total = range ? parseInt(range.split('/')[1] ?? '0', 10) : rows.length;

    const products = dedupe(rows.map(fmtProduct)).slice(0, limit);

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/products GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, categorySlug, brandSlug, price, mrp, unit, tags, imageUrls, blurDataUrls, inStock = true, isFeatured = false } = body;

    if (!name || !price || !unit) return NextResponse.json({ error: 'name, price, unit are required' }, { status: 400 });

    const [catRes, brandRes, firstCatRes] = await Promise.all([
      categorySlug ? fetch(`${SB}/rest/v1/categories?slug=eq.${encodeURIComponent(categorySlug)}&select=id&limit=1`, { headers: H, cache: 'no-store' }) : null,
      brandSlug    ? fetch(`${SB}/rest/v1/brands?slug=eq.${encodeURIComponent(brandSlug)}&select=id&limit=1`,         { headers: H, cache: 'no-store' }) : null,
      fetch(`${SB}/rest/v1/categories?order=sort_order.asc&limit=1&select=id`, { headers: H, cache: 'no-store' }),
    ]);

    const catRows:   any[] = catRes   ? await catRes.json()   : [];
    const brandRows: any[] = brandRes ? await brandRes.json() : [];
    const firstCats: any[] = await firstCatRes.json();

    const categoryId = catRows[0]?.id ?? firstCats[0]?.id ?? 'uncategorized';
    const brandId    = brandRows[0]?.id ?? null;

    const baseSlug  = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    let finalSlug   = baseSlug;
    let attempt     = 0;
    while (true) {
      const existing = await fetch(`${SB}/rest/v1/products?slug=eq.${encodeURIComponent(finalSlug)}&select=id&limit=1`, { headers: H, cache: 'no-store' });
      const rows: any[] = await existing.json();
      if (!rows.length) break;
      attempt++;
      finalSlug = `${baseSlug}-${attempt}`;
    }

    const sku = `FF-${Date.now()}`;
    const res = await fetch(`${SB}/rest/v1/products`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify({
        name, description: description ?? '', slug: finalSlug, sku, category_id: categoryId, brand_id: brandId,
        price: Number(price), mrp: Number(mrp ?? price), unit,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        image_urls:    JSON.stringify(Array.isArray(imageUrls)    ? imageUrls    : []),
        blur_data_urls: JSON.stringify(Array.isArray(blurDataUrls) ? blurDataUrls : []),
        in_stock: inStock, is_featured: isFeatured,
      }),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ product: fmtProduct(rows[0]) }, { status: 201 });
  } catch (err) {
    console.error('[admin/products POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
