import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Product } from '@/types';
import { db, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

export const revalidate = 300;

function formatProduct(p: Record<string, unknown>): Product {
  const cats = p['categories'] as Record<string, unknown> | null;
  const brand = p['brands'] as Record<string, unknown> | null;
  return {
    id: p['id'] as string,
    name: p['name'] as string,
    slug: p['slug'] as string,
    description: (p['description'] as string) ?? null,
    imageUrls: Array.isArray(p['image_urls']) ? p['image_urls'] as string[] : JSON.parse((p['image_urls'] as string) || '[]'),
    blurDataUrls: [],
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!isSupabaseConfigured) {
      const product = DEMO_PRODUCTS.find((p) => p.slug === slug);
      if (!product) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Not found' }, { status: 404 });
      return NextResponse.json<ApiResponse<Product>>({ data: product, error: null });
    }

    const raw = await db.getProductBySlug(slug);
    if (!raw) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Product not found' }, { status: 404 });

    return NextResponse.json<ApiResponse<Product>>({ data: formatProduct(raw), error: null });
  } catch (err) {
    console.error('Product slug API error:', err);
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch product' }, { status: 500 });
  }
}
