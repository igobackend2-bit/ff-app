import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, PaginatedResponse, Product } from '@/types';
import { db, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

export const revalidate = 60;

function formatProduct(p: Record<string, unknown>): Product {
  const cats = p['categories'] as Record<string, unknown> | null;
  const brand = p['brands'] as Record<string, unknown> | null;
  return {
    id: p['id'] as string,
    name: p['name'] as string,
    slug: p['slug'] as string,
    description: (p['description'] as string) ?? null,
    imageUrls: Array.isArray(p['image_urls']) ? p['image_urls'] as string[] : JSON.parse((p['image_urls'] as string) || '[]'),
    blurDataUrls: Array.isArray(p['blur_data_urls']) ? p['blur_data_urls'] as string[] : [],
    categoryId: p['category_id'] as string,
    categoryName: cats?.['name'] as string | undefined,
    categorySlug: (p['category_slug'] as string) ?? cats?.['slug'] as string | undefined,
    brandId: (p['brand_id'] as string) ?? null,
    brandName: brand?.['name'] as string | null ?? null,
    sku: p['sku'] as string,
    mrp: Number(p['mrp']),
    price: Number(p['price']),
    unit: p['unit'] as string,
    tags: Array.isArray(p['tags']) ? p['tags'] as string[] : JSON.parse((p['tags'] as string) || '[]'),
    isFeatured: Boolean(p['is_featured']),
    inStock: Boolean(p['in_stock']),
    averageRating: Number(p['average_rating']),
    reviewCount: Number(p['review_count']),
    metaTitle: (p['meta_title'] as string) ?? null,
    metaDescription: (p['meta_description'] as string) ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category') ?? undefined;
    const search   = searchParams.get('search') ?? undefined;
    const sort     = searchParams.get('sort') ?? 'relevance';
    const featured = searchParams.get('filter') === 'featured' || searchParams.get('sort') === 'relevance';
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
    const offset   = (page - 1) * limit;

    if (!isSupabaseConfigured) {
      // Fallback: return demo data
      let products = DEMO_PRODUCTS;
      if (category) products = products.filter((p) => p.categorySlug === category);
      if (search) products = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
      const sliced = products.slice(offset, offset + limit);
      return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
        data: { data: sliced, total: products.length, page, limit, hasMore: offset + limit < products.length },
        error: null,
      });
    }

    const { rows, total } = await db.getProducts({ category, search, featured: sort === 'relevance', sort, limit, offset });
    const formatted = rows.map(formatProduct);

    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
      data: { data: formatted, total, page, limit, hasMore: offset + formatted.length < total },
      error: null,
    });
  } catch (err) {
    console.error('Products API error:', err);
    const products = DEMO_PRODUCTS;
    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>({
      data: { data: products, total: products.length, page: 1, limit: 20, hasMore: false },
      error: null,
    });
  }
}
