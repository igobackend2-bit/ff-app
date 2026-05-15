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
    // When browsing a category with no explicit sort: sort by sortOrder ASC first (0 = top), then name
    if (category && !sort) orderBy = [{ name: 'asc' }]; // fallback if sortOrder col doesn't exist
    if (featured)          orderBy = [{ createdAt: 'desc' }];

    const [products, total] = await Promise.all([
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
