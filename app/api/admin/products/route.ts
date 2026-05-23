// Admin: List all products + Create new product
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** Deduplicate by name+unit — keep first occurrence (highest orderCount / sorted first) */
function deduplicateAdmin(products: any[]): any[] {
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
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const search = searchParams.get('q') ?? '';
    const categorySlug = searchParams.get('category') ?? '';
    const stockFilter = searchParams.get('stock'); // 'in' | 'out' | null

    const where: Record<string, unknown> = {};
    if (search) where['name'] = { contains: search };
    if (categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) where['categoryId'] = cat.id;
    }
    if (stockFilter === 'in') where['inStock'] = true;
    if (stockFilter === 'out') where['inStock'] = false;

    const sortParam = searchParams.get('sort') ?? '';

    // Try to add sortOrder column if missing (safe no-op if exists)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0`);
    } catch { /* already exists */ }

    let formattedProducts: any[];
    let total: number;

    if (sortParam === 'orders') {
      // ── Sort by most ordered: fetch all matching IDs, rank by order count, paginate ──
      const allMatchingIds = (await prisma.product.findMany({
        where,
        select: { id: true },
      })).map((p) => p.id);

      total = allMatchingIds.length;

      // Get order counts for all matching products
      const counts = await prisma.orderItem.groupBy({
        by: ['productId'],
        _count: { id: true },
        where: { productId: { in: allMatchingIds } },
      });
      const countMap = new Map(counts.map((c) => [c.productId, c._count.id]));

      // Sort IDs by count desc, then paginate
      const sortedIds = [...allMatchingIds].sort(
        (a, b) => (countMap.get(b) ?? 0) - (countMap.get(a) ?? 0),
      );
      const pageIds = sortedIds.slice((page - 1) * limit, page * limit);

      const pageProducts = await prisma.product.findMany({
        where: { id: { in: pageIds } },
        include: { brand: true, category: true },
      });
      // Restore sorted order (findMany order is not guaranteed)
      const orderedProducts = pageIds
        .map((id) => pageProducts.find((p) => p.id === id))
        .filter(Boolean) as typeof pageProducts;

      formattedProducts = deduplicateAdmin(orderedProducts.map((p: any) => ({
        ...p,
        imageUrls:    typeof p.imageUrls    === 'string' ? JSON.parse(p.imageUrls    || '[]') : p.imageUrls,
        blurDataUrls: typeof p.blurDataUrls === 'string' ? JSON.parse(p.blurDataUrls || '[]') : p.blurDataUrls,
        tags:         typeof p.tags         === 'string' ? JSON.parse(p.tags         || '[]') : p.tags,
        orderCount: countMap.get(p.id) ?? 0,
      })));
    } else {
      // ── Standard sort ──────────────────────────────────────────────────────
      type OrderBy = Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
      const orderBy: OrderBy =
        sortParam === 'rating'  ? { averageRating: 'desc' } :
        sortParam === 'popular' ? { reviewCount:   'desc' } :
        sortParam === 'order'   ? [{ sortOrder: 'asc' }, { createdAt: 'desc' }] :
                                  { createdAt: 'desc' };

      const [products, cnt] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { brand: true, category: true },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
      total = cnt;

      // Fetch order counts for just this page's products
      const pageIds = products.map((p) => p.id);
      const counts = await prisma.orderItem.groupBy({
        by: ['productId'],
        _count: { id: true },
        where: { productId: { in: pageIds } },
      });
      const countMap = new Map(counts.map((c) => [c.productId, c._count.id]));

      formattedProducts = deduplicateAdmin(products.map((p: any) => ({
        ...p,
        imageUrls:    typeof p.imageUrls    === 'string' ? JSON.parse(p.imageUrls    || '[]') : p.imageUrls,
        blurDataUrls: typeof p.blurDataUrls === 'string' ? JSON.parse(p.blurDataUrls || '[]') : p.blurDataUrls,
        tags:         typeof p.tags         === 'string' ? JSON.parse(p.tags         || '[]') : p.tags,
        orderCount: countMap.get(p.id) ?? 0,
      })));
    }

    return NextResponse.json({
      products: formattedProducts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[admin/products GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, slug, description, categorySlug, brandSlug,
      price, mrp, unit, tags, imageUrls, blurDataUrls,
      inStock = true, isFeatured = false,
    } = body;

    if (!name || !slug || !price || !unit) {
      return NextResponse.json({ error: 'name, slug, price, unit are required' }, { status: 400 });
    }

    const [category, brand, firstCategory] = await Promise.all([
      categorySlug ? prisma.category.findUnique({ where: { slug: categorySlug } }) : null,
      brandSlug    ? prisma.brand.findUnique({    where: { slug: brandSlug    } }) : null,
      // Fallback: grab the first category in case none is selected
      prisma.category.findFirst({ orderBy: { sortOrder: 'asc' } }),
    ]);

    const sku = `FF-${Date.now()}`;

    // Build a unique slug — if the requested slug already exists, append a suffix
    const baseSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-+|-+$/g, '');
    let finalSlug  = baseSlug;
    let attempt    = 0;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      attempt++;
      finalSlug = `${baseSlug}-${attempt}`;
    }

    const product = await prisma.product.create({
      data: {
        name, description: description ?? '',
        slug: finalSlug,
        sku,
        categoryId: category?.id ?? firstCategory?.id ?? 'uncategorized',
        brandId:    brand?.id   ?? null,
        price:      Number(price),
        mrp:        Number(mrp ?? price),
        unit,
        tags:        JSON.stringify(Array.isArray(tags) ? tags : []),
        imageUrls:   JSON.stringify(Array.isArray(imageUrls) ? imageUrls : []),
        blurDataUrls: JSON.stringify(Array.isArray(blurDataUrls) ? blurDataUrls : []),
        inStock,
        isFeatured,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && (err as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this name already exists. Please use a different name.' },
        { status: 409 },
      );
    }
    const msg = err instanceof Error ? err.message : 'Server error';
    console.error('[admin/products POST]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
