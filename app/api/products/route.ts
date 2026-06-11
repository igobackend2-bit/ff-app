import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse, Product } from '@/types';
import { prisma } from '@/lib/db';
import { cleanProductName, localizeImageUrls } from '@/lib/clean-name';
import { filterExtraProducts } from '@/lib/extra-products';

// Legacy live site — used as a read-only fallback when our DB is unreachable
const LEGACY_SOURCE = 'https://ff-app-pi.vercel.app';

/** Proxy product reads from the legacy site, cleaning broken names on the fly. */
async function proxyFromLegacy(query: string): Promise<PaginatedResponse<Product> | null> {
  try {
    const res = await fetch(`${LEGACY_SOURCE}/api/products?${query}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: PaginatedResponse<Product> };
    const d = json.data;
    if (!d?.data) return null;
    d.data = d.data.map((p) => ({
      ...p,
      name: cleanProductName(p.name, p.slug),
      imageUrls: localizeImageUrls(p.imageUrls),
    }));
    return d;
  } catch {
    return null;
  }
}

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

/** Deduplicate by name+unit — keep the first occurrence (highest order count / newest) */
function deduplicateByNameUnit(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    const key = `${p.name.trim().toLowerCase()}||${p.unit.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
    const where: Record<string, any> = { isActive: true };

    // When browsing categories/featured, only show in-stock items
    if (!search) where['inStock'] = true;
    if (category) where['category'] = { slug: category };
    if (search) {
      where['OR'] = [
        { name:        { contains: search } },
        { description: { contains: search } },
        { tags:        { contains: search } },
      ];
    }
    if (featured) where['isFeatured'] = true;

    // ── Sort=orders: rank by order count ─────────────────────────────────────
    if (sort === 'orders') {
      const allIds = (await prisma.product.findMany({ where, select: { id: true } })).map((p) => p.id);

      const counts = await prisma.orderItem.groupBy({
        by: ['productId'],
        _count: { id: true },
        where: { productId: { in: allIds } },
      });
      const countMap = new Map(counts.map((c) => [c.productId, c._count.id]));

      // Sort by count desc; products with 0 orders sort after those with orders
      const sortedIds = [...allIds].sort((a, b) => (countMap.get(b) ?? 0) - (countMap.get(a) ?? 0));

      // Fetch enough to fill the page after dedup (fetch 2× limit to absorb duplicates)
      const fetchIds = sortedIds.slice(offset, offset + limit * 2);
      const pageProducts = await prisma.product.findMany({
        where: { id: { in: fetchIds } },
        include: {
          category: { select: { name: true, slug: true } },
          brand:    { select: { name: true } },
        },
      });
      // Restore order
      const ordered = fetchIds
        .map((id) => pageProducts.find((p) => p.id === id))
        .filter(Boolean) as typeof pageProducts;

      const formatted = deduplicateByNameUnit(ordered.map(formatProduct)).slice(0, limit);
      const total = deduplicateByNameUnit(allIds.map((id) => ({ id, name: '', unit: '' } as any)).map(() => ({ id: '', name: '', unit: '' } as any))).length;

      return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
        data: { data: formatted, total: allIds.length, page, limit, hasMore: offset + limit < allIds.length },
        error: null,
      });
    }

    // ── Standard sorts ────────────────────────────────────────────────────────
    let orderBy: any = [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
    if (sort === 'price-asc')  orderBy = [{ price: 'asc' }];
    if (sort === 'price-desc') orderBy = [{ price: 'desc' }];
    if (sort === 'name-asc')   orderBy = [{ name: 'asc' }];
    if (sort === 'newest')     orderBy = [{ createdAt: 'desc' }];
    if (featured)              orderBy = [{ createdAt: 'desc' }];

    // Fetch extra to absorb duplicates then slice to limit
    const [rawProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          brand:    { select: { name: true } },
        },
        orderBy,
        skip: offset,
        take: limit * 2,
      }),
      prisma.product.count({ where }),
    ]);

    let formatted = deduplicateByNameUnit(rawProducts.map(formatProduct)).slice(0, limit);

    // Append zip-imported Meat & Seafood products (not yet in DB)
    const extras = filterExtraProducts({ category, search, featured });
    if (extras.length > 0 && page === 1) {
      const existingSlugs = new Set(formatted.map((x) => x.slug));
      formatted = [...formatted, ...extras.filter((x) => !existingSlugs.has(x.slug))];
    }

    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
      data: {
        data: formatted,
        total: total + extras.length,
        page,
        limit,
        hasMore: offset + formatted.length < total,
      },
      error: null,
    });
  } catch (err) {
    console.error('Products API error:', err);

    // DB unreachable — serve live data from the legacy site instead
    const sp = req.nextUrl.searchParams;
    const proxied = await proxyFromLegacy(sp.toString());
    if (proxied) {
      const extras = filterExtraProducts({
        category: sp.get('category') ?? '',
        search:   sp.get('search') ?? '',
        featured: sp.get('filter') === 'featured',
      });
      if (extras.length > 0 && (parseInt(sp.get('page') ?? '1', 10) || 1) === 1) {
        const existingSlugs = new Set(proxied.data.map((x) => x.slug));
        proxied.data  = [...proxied.data, ...extras.filter((x) => !existingSlugs.has(x.slug))];
        proxied.total += extras.length;
      }
      return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({ data: proxied, error: null });
    }

    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
      data: { data: [], total: 0, page: 1, limit: 20, hasMore: false },
      error: 'Failed to load products',
    }, { status: 500 });
  }
}
