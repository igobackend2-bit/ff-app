import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse, Product } from '@/types';
import { prisma } from '@/lib/db';

export const revalidate = 0; // always fresh from DB

function formatProduct(p: {
  id: string; name: string; slug: string; description: string | null;
  imageUrls: string; blurDataUrls: string; categoryId: string; brandId: string | null;
  sku: string; mrp: number; price: number; unit: string; tags: string;
  isFeatured: boolean; inStock: boolean; averageRating: number; reviewCount: number;
  metaTitle: string | null; metaDescription: string | null;
  category: { name: string; slug: string } | null;
  brand: { name: string } | null;
}): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    imageUrls: (() => {
      try { return JSON.parse(p.imageUrls) as string[]; }
      catch { return p.imageUrls ? [p.imageUrls] : []; }
    })(),
    blurDataUrls: (() => {
      try { return JSON.parse(p.blurDataUrls) as string[]; }
      catch { return []; }
    })(),
    categoryId: p.categoryId,
    categoryName: p.category?.name,
    categorySlug: p.category?.slug,
    brandId: p.brandId ?? null,
    brandName: p.brand?.name ?? null,
    sku: p.sku,
    mrp: p.mrp,
    price: p.price,
    unit: p.unit,
    tags: (() => {
      try { return JSON.parse(p.tags) as string[]; }
      catch { return []; }
    })(),
    isFeatured: p.isFeatured,
    inStock: p.inStock,
    averageRating: p.averageRating,
    reviewCount: p.reviewCount,
    metaTitle: p.metaTitle ?? null,
    metaDescription: p.metaDescription ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category') ?? '';
    const search   = searchParams.get('search') ?? '';
    const sort     = searchParams.get('sort') ?? 'relevance';
    const featured = searchParams.get('filter') === 'featured';
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit    = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10));
    const offset   = (page - 1) * limit;

    // Build where clause — only show active products
    const where: Record<string, any> = {
      isActive: true
    };

    // When browsing categories/featured, only show in-stock items
    if (!search) where['inStock'] = true;
    if (category) where['category'] = { slug: category };
    if (search) {
      // Search across name, description and tags
      where['OR'] = [
        { name:        { contains: search } },
        { description: { contains: search } },
        { tags:        { contains: search } },
      ];
    }
    if (featured) where['isFeatured'] = true;

    // Build orderBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: Record<string, any> = [{ createdAt: 'desc' }];
    if (sort === 'price-asc')  orderBy = [{ price: 'asc' }];
    if (sort === 'price-desc') orderBy = [{ price: 'desc' }];
    if (sort === 'name-asc')   orderBy = [{ name: 'asc' }];
    if (featured)              orderBy = [{ createdAt: 'desc' }];

    // For default/relevance sort: use custom sortOrder (set in admin) — honey=1, onion=2, etc.
    // sortOrder=0 means unset → sorts last
    const useCustomOrder = (sort === 'relevance' || !sort) && !featured;

    // Ensure sortOrder column exists (safe no-op if already present)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0`);
    } catch { /* already exists */ }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let products: any[];
    let total: number;

    if (useCustomOrder) {
      // Build dynamic WHERE for raw SQL
      const conditions: string[] = [`"isActive" = 1`];
      const rawArgs: unknown[] = [];
      if (!search) conditions.push(`"inStock" = 1`);
      if (category) { conditions.push(`"categoryId" = (SELECT id FROM "Category" WHERE slug = ?)`); rawArgs.push(category); }
      if (search) {
        conditions.push(`("name" LIKE ? OR "description" LIKE ? OR "tags" LIKE ?)`);
        rawArgs.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (featured) { conditions.push(`"isFeatured" = 1`); }
      const whereClause = conditions.join(' AND ');

      const countRows = await prisma.$queryRawUnsafe<{ cnt: number }[]>(
        `SELECT COUNT(*) AS cnt FROM "Product" WHERE ${whereClause}`,
        ...rawArgs,
      );
      total = Number(countRows[0]?.cnt ?? 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT p.*, c.name AS catName, c.slug AS catSlug, b.name AS brandName
         FROM "Product" p
         LEFT JOIN "Category" c ON p."categoryId" = c.id
         LEFT JOIN "Brand" b ON p."brandId" = b.id
         WHERE ${whereClause}
         ORDER BY CASE WHEN "sortOrder" = 0 THEN 9999 ELSE "sortOrder" END ASC, p."createdAt" DESC
         LIMIT ? OFFSET ?`,
        ...rawArgs, limit, offset,
      );
      products = rawRows.map((r: any) => ({
        ...r,
        category: r.catName ? { name: r.catName, slug: r.catSlug } : null,
        brand: r.brandName ? { name: r.brandName } : null,
      }));
    } else {
      [products, total] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.product.findMany as any)({
          where,
          include: {
            category: { select: { name: true, slug: true } },
            brand:    { select: { name: true } },
          },
          orderBy,
          skip: offset,
          take: limit,
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma.product.count as any)({ where }),
      ]);
    }

    const formatted = products.map(formatProduct);

    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
      data: {
        data: formatted,
        total,
        page,
        limit,
        hasMore: offset + formatted.length < total,
      },
      error: null,
    });
  } catch (err) {
    console.error('Products API error:', err);
    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
      data: { data: [], total: 0, page: 1, limit: 20, hasMore: false },
      error: 'Failed to load products',
    }, { status: 500 });
  }
}
