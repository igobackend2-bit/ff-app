import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse, Product } from '@/types';
import { prisma } from '@/lib/db';
import { cleanProductName, localizeImageUrls, localizeImageUrl } from '@/lib/clean-name';
import { resolveImageByName } from '@/lib/product-image-resolver';
import { resolveCategory } from '@/lib/category-resolver';
import { filterExtraProducts } from '@/lib/extra-products';
import { db } from '@/lib/supabase';

// Legacy live site — used as a read-only fallback when our DB is unreachable
const LEGACY_SOURCE = 'https://ff-app-pi.vercel.app';

// Empty-category remaps: legacy DB keeps these products under a sibling category
const CATEGORY_FALLBACKS: Record<string, { source: string; nameFilter?: RegExp }> = {
  'dairy-ghee':        { source: 'oils-ghee', nameFilter: /ghee|curd|paneer|butter/i },
  'honey':             { source: 'honey-jaggery', nameFilter: /honey|jaggery|palm/i },
  'cold-pressed-oils': { source: 'oils-ghee' },
};

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

    // Category empty in legacy DB? Pull from its sibling category instead
    if (d.data.length === 0) {
      const params = new URLSearchParams(query);
      const fb = CATEGORY_FALLBACKS[params.get('category') ?? ''];
      if (fb) {
        params.set('category', fb.source);
        const fbRes = await fetch(`${LEGACY_SOURCE}/api/products?${params}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        if (fbRes.ok) {
          const fbJson = (await fbRes.json()) as { data: PaginatedResponse<Product> };
          if (fbJson.data?.data) {
            d.data  = fb.nameFilter ? fbJson.data.data.filter((p) => fb.nameFilter!.test(p.name)) : fbJson.data.data;
            d.total = d.data.length;
          }
        }
      }
    }

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

/** Deduplicate by name+unit. Keeps the first occurrence (already sorted newest-
 *  updated first), but if that one is out of stock and a later duplicate is in
 *  stock, swap to the in-stock row so the card and the detail page agree. */
function deduplicateByNameUnit(products: Product[]): Product[] {
  const byKey = new Map<string, number>(); // key -> index in `out`
  const out: Product[] = [];
  for (const p of products) {
    const key = `${p.name.trim().toLowerCase()}||${p.unit.trim().toLowerCase()}`;
    const existingIdx = byKey.get(key);
    if (existingIdx === undefined) {
      byKey.set(key, out.length);
      out.push(p);
    } else if (out[existingIdx] && !out[existingIdx].inStock && p.inStock) {
      out[existingIdx] = p; // prefer the in-stock duplicate
    }
  }
  return out;
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

    // When Prisma is disabled/absent (production), skip straight to the Supabase
    // path so admin edits (stock, delete, price) are what customers actually see.
    if (process.env['DB_DISABLED'] === '1' || !process.env['DATABASE_URL']) {
      throw new Error('prisma-disabled: use Supabase path');
    }

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

    const sp       = req.nextUrl.searchParams;
    const category = sp.get('category') ?? '';
    const search   = sp.get('search') ?? '';
    const featured = sp.get('filter') === 'featured';
    const page     = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
    const limit    = Math.min(100, parseInt(sp.get('limit') ?? '20', 10));
    const sort     = sp.get('sort') ?? 'relevance';
    const offset   = (page - 1) * limit;

    // ── Try ERP Supabase first ──────────────────────────────────────────────
    // When a category is requested we can't rely on the DB's category_slug
    // (products are mis-bucketed into "valluvam"). Fetch a wide set and filter
    // by the name-resolved category in JS.
    const catRequested = Boolean(category);
    try {
      // Fetch a wide set always, so dedupe (below) sees every duplicate row and
      // can pick the in-stock one; we paginate after deduping.
      const wide = catRequested || !search;
      const { rows, total } = await db.getProducts({
        category: undefined,                         // resolve category ourselves
        search:   search   || undefined,
        featured: featured || undefined,
        limit:    wide ? 1000 : Math.max(limit * 3, 60),
        offset:   0,
        sort: sort === 'price-asc' ? 'price_asc' : sort === 'price-desc' ? 'price_desc' : sort === 'newest' ? 'new' : undefined,
      });

      const mapped: Product[] = (rows as any[]).map((p) => {
        const imgs: string[] = (() => { try { return JSON.parse(p.image_urls ?? '[]'); } catch { return p.image_url ? [p.image_url] : []; } })();
        const cleanName = cleanProductName(p.name, p.slug);
        const localized = localizeImageUrls(imgs.length ? imgs : (p.image_url ? [p.image_url] : []));
        // Correct a mis-bucketed category first (everything was dumped in "valluvam").
        const rc = resolveCategory(cleanName, p.category_slug);
        const catSlug = rc?.slug ?? p.category_slug;
        // Then pick the image by name *within that category's folder* — the DB
        // image_url is frequently wrong (Fresh Coconut showing coconut oil, etc.).
        const byName = resolveImageByName(cleanName, catSlug) ?? resolveImageByName(p.name, catSlug);
        const finalImgs = byName
          ? [byName, ...localized.filter((u) => u !== byName)]
          : (localized.length ? localized : []);
        return {
          id:            p.id,
          name:          cleanName,
          slug:          p.slug,
          description:   p.description ?? null,
          imageUrls:     finalImgs,
          blurDataUrls:  [],
          categoryId:    p.category_id ?? '',
          categoryName:  rc?.name ?? p.category ?? p.category_name ?? '',
          categorySlug:  rc?.slug ?? p.category_slug ?? '',
          brandId:       p.brand_id ?? null,
          brandName:     null,
          sku:           p.sku ?? '',
          mrp:           Number(p.mrp ?? p.price ?? 0),
          price:         Number(p.price ?? 0),
          unit:          p.unit ?? '',
          tags:          (() => { try { return JSON.parse(p.tags ?? '[]'); } catch { return []; } })(),
          isFeatured:    Boolean(p.is_featured),
          inStock:       p.in_stock !== false,
          averageRating: Number(p.average_rating ?? 0),
          reviewCount:   Number(p.review_count ?? 0),
          metaTitle:     null,
          metaDescription: null,
        };
      });

      // Collapse duplicate product rows (same name+unit) — prefers the in-stock one.
      const deduped = deduplicateByNameUnit(mapped);

      // Category filter, then paginate — always slice locally since we fetched wide.
      let pool = deduped;
      if (catRequested) {
        // "valluvam" is the traditional-products umbrella — include all its sub-cats.
        const VALLUVAM = ['valluvam', 'ghee', 'dairy-ghee', 'honey', 'palm-jaggery', 'oils', 'cold-pressed-oils', 'millets', 'spices', 'nuts', 'dry-fruits', 'seeds-health-mix'];
        const wanted = category === 'valluvam' ? new Set(VALLUVAM) : new Set([category]);
        pool = deduped.filter((m) => wanted.has(m.categorySlug ?? ''));
      }
      const listTotal = pool.length;
      const list = pool.slice(offset, offset + limit);

      const extras = filterExtraProducts({ category, search, featured });
      const combined = page === 1
        ? [...list, ...extras.filter((x) => !list.some((m) => m.slug === x.slug))]
        : list;

      return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
        data: { data: combined, total: listTotal + (page === 1 ? extras.length : 0), page, limit, hasMore: offset + limit < listTotal },
        error: null,
      });
    } catch (erpErr) {
      console.error('ERP Supabase products error:', erpErr);
    }

    // ── Last resort: proxy to legacy site (no category filtering guarantee) ──
    const proxied = await proxyFromLegacy(sp.toString());
    if (proxied) {
      const extras = filterExtraProducts({ category, search, featured });
      if (extras.length > 0 && page === 1) {
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
