import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const STORE_ID   = 'main-store';
const STORE_NAME = 'Main Store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 25));
    const q     = searchParams.get('q') ?? '';
    const stock = searchParams.get('stock') ?? 'all';
    const offset = (page - 1) * limit;

    const filters = ['is_active=eq.true'];
    if (q) filters.push(`name=ilike.*${encodeURIComponent(q)}*`);

    const filterStr = filters.join('&');

    const [dataRes, countRes] = await Promise.all([
      fetch(`${SB}/rest/v1/products?${filterStr}&order=name.asc&limit=${limit}&offset=${offset}&select=id,name,slug,sku,unit,image_urls,price,in_stock`,
        { headers: H, cache: 'no-store' }),
      fetch(`${SB}/rest/v1/products?${filterStr}&select=id`,
        { headers: { ...H, Prefer: 'count=exact' }, cache: 'no-store' }),
    ]);

    const products: any[] = await dataRes.json();
    const range = countRes.headers.get('content-range');
    const total = range ? parseInt(range.split('/')[1] ?? '0', 10) : products.length;

    if (!products.length) return NextResponse.json({ rows: [], total: 0, pages: 0 });

    // Fetch inventory records
    const productIds = products.map((p) => p.id);
    const invRes = await fetch(
      `${SB}/rest/v1/inventory?product_id=in.(${productIds.map(id => `"${id}"`).join(',')})&dark_store_id=eq.${STORE_ID}`,
      { headers: H, cache: 'no-store' }
    );
    const invRecords: any[] = await invRes.json();
    const invMap = new Map(invRecords.map((r) => [r.product_id, r]));

    const rows = products.map((p) => {
      const inv = invMap.get(p.id);
      return {
        productId: p.id, invId: inv?.id ?? null,
        name: p.name, slug: p.slug, sku: p.sku, unit: p.unit,
        imageUrls: (() => { try { return JSON.parse(p.image_urls ?? '[]'); } catch { return []; } })(),
        price: p.price, inStock: p.in_stock,
        quantity: inv?.quantity ?? (p.in_stock ? 100 : 0),
        threshold: inv?.threshold ?? 10,
        store: { id: STORE_ID, name: STORE_NAME },
      };
    });

    const filtered = stock === 'low'  ? rows.filter((r) => r.quantity > 0 && r.quantity <= r.threshold)
                   : stock === 'out'  ? rows.filter((r) => r.quantity <= 0 || !r.inStock)
                   : rows;

    return NextResponse.json({ rows: filtered, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/inventory GET]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
