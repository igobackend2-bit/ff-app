import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Product } from '@/types';
import { prisma } from '@/lib/db';

export const revalidate = 0;

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findFirst({
      where: { 
        slug,
        isActive: true 
      },
      include: {
        category: { select: { name: true, slug: true } },
        brand:    { select: { name: true } },
      },
    });

    if (!product) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Product not found' },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<Product>>({
      data: formatProduct(product),
      error: null,
    });
  } catch (err) {
    console.error('Product slug API error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to fetch product' },
      { status: 500 },
    );
  }
}
