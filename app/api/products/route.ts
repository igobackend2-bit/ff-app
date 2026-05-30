import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse, Product } from '@/types';

export const revalidate = 0;

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const SUPABASE_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

function formatProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    imageUrls: (() => { try { return JSON.parse(p.image_urls); } catch { return p.image_urls ? [p.image_urls] : []; } })(),
    blurDataUrls: (() => { try { return JSON.parse(p.blur_data_urls ?? '[]'); } catch { return []; } })(),
    categoryId: p.category_id,
    categoryName: p.categories?.name,
    categorySlug: p.categories?.slug ?? p.category_slug,
    brandId: p.brand_id ?? null,
    brandName: p.brands?.name ?? null,
    sku: p.sku,
    mrp: p.mrp,
    price: p.price,
    unit: p.unit,
    tags: (() => { try { return JSON.parse(p.tags ?? '[]'); } catch { return []; } })(),
    isFeatured: p.is_featured,
    inStock: p.in_stock,
    averageRating: p.average_rating,
    reviewCount: p.review_count,
    metaTitle: p.meta_title ?? null,
    metaDescription: p.meta_description ?? null,
  };
}

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

    // Build Supabase query filters
    const filters: string[] = ['is_active=eq.true'];
    if (!search) filters.push('in_stock=eq.true');
    if (featured) filters.push('is_featured=eq.true');

    // Sort
    let order = 'sort_order.asc,created_at.desc';
    if (sort === 'price-asc')  order = 'price.asc';
    if (sort === 'price-desc') order = 'price.desc';
    if (sort === 'name-asc')   order = 'name.asc';
    if (sort === 'newest')     order = 'created_at.desc';

    const filterStr = filters.join('&');
    const fetchLimit = limit * 2; // fetch extra to absorb deduplication

    // Build URL
    let url = `${SUPABASE_URL}/rest/v1/products?${filterStr}&order=${order}&limit=${fetchLimit}&offset=${offset}&select=*,categories(name,slug),brands(name)`;
    if (category) url += `&categories.slug=eq.${category}`;
    if (search) url += `&name=ilike.*${encodeURIComponent(search)}*`;

    // Get total count
    const countUrl = `${SUPABASE_URL}/rest/v1/products?${filterStr}${search ? `&name=ilike.*${encodeURIComponent(search)}*` : ''}`;

    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'count=exact' };

    const [dataRes, countRes] = await Promise.all([
      fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: 'no-store' }),
      fetch(countUrl + '&select=id', { headers, cache: 'no-store' }),
    ]);

    const rows: any[] = await dataRes.json();
    const contentRange = countRes.headers.get('content-range');
    const total = contentRange ? parseInt(contentRange.split('/')[1] ?? '0', 10) : rows.length;

    // Filter by category slug if needed (PostgREST join filter)
    const filtered = category
      ? rows.filter((p: any) => p.categories?.slug === category || p.category_slug === category)
      : rows;

    const formatted = deduplicateByNameUnit(filtered.map(formatProduct)).slice(0, limit);

    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
      data: { data: formatted, total, page, limit, hasMore: offset + formatted.length < total },
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
