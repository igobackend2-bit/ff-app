// Admin: List all products + Create new product
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    // For 'order' sort we need raw SQL (CASE WHEN sortOrder=0 THEN 9999 ELSE sortOrder END ASC)
    // For other sorts we use Prisma ORM
    type OrderBy = Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
    const orderBy: OrderBy =
      sortParam === 'rating'
        ? { averageRating: 'desc' }
        : sortParam === 'popular'
        ? { reviewCount: 'desc' }
        : sortParam === 'order'
        ? [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

    // Try to add sortOrder column if missing (safe no-op if exists)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0`);
    } catch { /* already exists */ }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true, category: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map((p: any) => ({
      ...p,
      imageUrls: typeof p.imageUrls === 'string' ? JSON.parse(p.imageUrls || '[]') : p.imageUrls,
      blurDataUrls: typeof p.blurDataUrls === 'string' ? JSON.parse(p.blurDataUrls || '[]') : p.blurDataUrls,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : p.tags,
    }));

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
    // Prisma unique constraint violation (e.g. SKU collision — extremely rare)
    if (
      err instanceof Error &&
      (err as { code?: string }).code === 'P2002'
    ) {
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
