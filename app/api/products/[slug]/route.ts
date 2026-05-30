import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Product } from '@/types';

export const revalidate = 0;

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

function fmt(p: any): Product {
  return {
    id: p.id, name: p.name, slug: p.slug, description: p.description ?? null,
    imageUrls: (() => { try { return JSON.parse(p.image_urls); } catch { return p.image_urls ? [p.image_urls] : []; } })(),
    blurDataUrls: (() => { try { return JSON.parse(p.blur_data_urls ?? '[]'); } catch { return []; } })(),
    categoryId: p.category_id, categoryName: p.categories?.name, categorySlug: p.categories?.slug ?? p.category_slug,
    brandId: p.brand_id ?? null, brandName: p.brands?.name ?? null,
    sku: p.sku, mrp: p.mrp, price: p.price, unit: p.unit,
    tags: (() => { try { return JSON.parse(p.tags ?? '[]'); } catch { return []; } })(),
    isFeatured: p.is_featured, inStock: p.in_stock,
    averageRating: p.average_rating, reviewCount: p.review_count,
    metaTitle: p.meta_title ?? null, metaDescription: p.meta_description ?? null,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const res = await fetch(
      `${SB}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1&select=*,categories(name,slug),brands(name)`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }
    );
    const rows: any[] = await res.json();
    if (!rows.length) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Product not found' }, { status: 404 });
    return NextResponse.json<ApiResponse<Product>>({ data: fmt(rows[0]), error: null });
  } catch (err) {
    console.error('Product slug API error:', err);
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch product' }, { status: 500 });
  }
}
