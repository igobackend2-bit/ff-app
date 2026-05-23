// Admin: Inventory listing — real Inventory records merged with Products
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const STORE_ID   = 'main-store';
const STORE_NAME = 'Main Store';

/** Ensure the default DarkStore exists */
async function ensureStore() {
  await prisma.darkStore.upsert({
    where:  { id: STORE_ID },
    create: { id: STORE_ID, name: STORE_NAME, city: 'Chennai', pincode: '600001', lat: 13.08, lng: 80.27, isActive: true },
    update: {},
  });
}

export async function GET(req: NextRequest) {
  try {
    await ensureStore();

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 25));
    const q     = searchParams.get('q') ?? '';
    const stock = searchParams.get('stock') ?? 'all'; // all | low | out

    const where: Record<string, unknown> = { isActive: true };
    if (q) {
      where['OR'] = [
        { name: { contains: q } },
        { sku:  { contains: q } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: { id: true, name: true, slug: true, sku: true, unit: true, imageUrls: true, price: true, inStock: true },
        orderBy: { name: 'asc' },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      prisma.product.count({ where }),
    ]);

    if (products.length === 0) {
      return NextResponse.json({ rows: [], total: 0, pages: 0 });
    }

    // Fetch real inventory records for these products
    const productIds = products.map((p) => p.id);
    const invRecords = await prisma.inventory.findMany({
      where: { productId: { in: productIds }, darkStoreId: STORE_ID },
    });
    const invMap = new Map(invRecords.map((r) => [r.productId, r]));

    const rows = products.map((p) => {
      const inv      = invMap.get(p.id);
      const quantity = inv?.quantity ?? (p.inStock ? 100 : 0);
      const threshold = inv?.threshold ?? 10;
      return {
        productId: p.id,
        invId:     inv?.id ?? null,
        name:      p.name,
        slug:      p.slug,
        sku:       p.sku,
        unit:      p.unit,
        imageUrls: p.imageUrls,
        price:     p.price,
        inStock:   p.inStock,
        quantity,
        threshold,
        store:     { id: STORE_ID, name: STORE_NAME },
      };
    });

    // Client-side stock filter
    const filtered = stock === 'low'
      ? rows.filter((r) => r.quantity > 0 && r.quantity <= r.threshold)
      : stock === 'out'
        ? rows.filter((r) => r.quantity <= 0 || !r.inStock)
        : rows;

    return NextResponse.json({
      rows:  filtered,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[admin/inventory GET]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
