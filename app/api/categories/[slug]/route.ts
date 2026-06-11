import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Category } from '@/types';
import { prisma } from '@/lib/db';

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Zip-imported Meat & Seafood category (not yet in DB)
    if (slug === 'meat-seafood') {
      const { MEAT_CATEGORY } = await import('@/lib/extra-products');
      return NextResponse.json({ data: MEAT_CATEGORY, error: null });
    }

    const c = await prisma.category.findFirst({
      where: { slug, isActive: true },
      include: { _count: { select: { products: true } } },
    });

    if (!c) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Category not found' },
        { status: 404 },
      );
    }

    const category: Category & { _count?: { products: number } } = {
      id:              c.id,
      name:            c.name,
      slug:            c.slug,
      description:     c.description ?? null,
      imageUrl:        c.imageUrl ?? '',
      iconUrl:         c.iconUrl ?? null,
      parentId:        c.parentId ?? null,
      sortOrder:       c.sortOrder,
      metaTitle:       c.metaTitle ?? null,
      metaDescription: c.metaDescription ?? null,
      _count:          { products: c._count.products },
    };

    return NextResponse.json({ data: category, error: null });
  } catch (err) {
    console.error('Category slug API error:', err);

    // DB unreachable — proxy from the legacy live site
    try {
      const { slug } = await params;
      const res = await fetch(`https://ff-app-pi.vercel.app/api/categories/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Category | null };
        if (json.data) return NextResponse.json({ data: json.data, error: null });
      }
    } catch { /* fall through */ }

    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to fetch category' },
      { status: 500 },
    );
  }
}
