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

    // DB unreachable (DB_DISABLED) — derive the category from ERP Supabase products
    try {
      const { slug } = await params;

      // Hardcoded extra categories (Meat, Nuts, Dry Fruits, etc.)
      const { getExtraCategories } = await import('@/lib/extra-products');
      const extra = getExtraCategories().find((c) => c.slug === slug);
      if (extra) return NextResponse.json({ data: extra, error: null });

      const { db } = await import('@/lib/supabase');
      const { localizeImageUrl, cleanCategoryName } = await import('@/lib/clean-name');
      const r = (await db.getCategoryBySlug(slug)) as any;
      if (r) {
        const category: Category & { _count?: { products: number } } = {
          id:              r.id,
          name:            cleanCategoryName(r.name, slug),
          slug,
          description:     r.description ?? null,
          imageUrl:        r.image_url ? localizeImageUrl(r.image_url) : (r.image_url ?? ''),
          iconUrl:         null,
          parentId:        null,
          sortOrder:       r.sort_order ?? 0,
          metaTitle:       null,
          metaDescription: null,
        };
        return NextResponse.json({ data: category, error: null });
      }
    } catch { /* fall through */ }

    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to fetch category' },
      { status: 404 },
    );
  }
}
