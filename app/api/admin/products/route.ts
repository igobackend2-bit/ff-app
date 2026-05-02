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

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true, category: true },
        orderBy: { createdAt: 'desc' },
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

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    const brand = brandSlug
      ? await prisma.brand.findUnique({ where: { slug: brandSlug } })
      : null;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        categoryId: category?.id ?? '',
        brandId: brand?.id ?? null,
        price: Number(price),
        mrp: Number(mrp ?? price),
        sku: name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().substring(8),
        unit,
        tags: JSON.stringify(tags ?? []),
        imageUrls: JSON.stringify(imageUrls ?? []),
        blurDataUrls: JSON.stringify(blurDataUrls ?? []),
        inStock,
        isFeatured,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
