import { NextResponse } from 'next/server';
import type { ApiResponse, Category } from '@/types';
import { prisma } from '@/lib/db';

export const revalidate = 0;

async function injectExtras(data: any[]): Promise<any[]> {
  const { getExtraCategories }  = await import('@/lib/extra-products');
  const { localizeImageUrl, cleanCategoryName } = await import('@/lib/clean-name');
  for (const ec of getExtraCategories()) {
    if (!data.some((c) => c.slug === ec.slug)) {
      data.push({
        ...ec,
        description:     ec.description ?? null,
        iconUrl:         null,
        parentId:        null,
        metaTitle:       ec.metaTitle ?? null,
        metaDescription: ec.metaDescription ?? null,
        imageUrl:        ec.imageUrl ? localizeImageUrl(ec.imageUrl) : ec.imageUrl,
      });
    }
  }
  // Apply category name fixes (e.g. "Valluvam" → "Naatu Sarkarai & Karupatti")
  for (const c of data) {
    c.name = cleanCategoryName(c.name as string, c.slug as string);
  }
  data.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  return data;
}

export async function GET() {
  try {
    const rows = await prisma.category.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });

    const data = rows.map((c) => ({
      id:              c.id,
      name:            c.name,
      slug:            c.slug,
      description:     c.description ?? null,
      imageUrl:        c.imageUrl,
      iconUrl:         c.iconUrl ?? null,
      parentId:        c.parentId ?? null,
      sortOrder:       c.sortOrder,
      metaTitle:       c.metaTitle ?? null,
      metaDescription: c.metaDescription ?? null,
      _count:          { products: c._count.products },
    }));

    return NextResponse.json({ data: await injectExtras(data), error: null });
  } catch (err) {
    console.error('Categories API error:', err);

    // DB unreachable (DB_DISABLED in production) — read from ERP Supabase directly
    try {
      const { db } = await import('@/lib/supabase');
      const { localizeImageUrl } = await import('@/lib/clean-name');
      const rows = await db.getCategories();

      const data = (rows as any[]).map((c) => ({
        id:              c.id,
        name:            c.name,
        slug:            c.slug,
        description:     c.description ?? null,
        imageUrl:        c.image_url ? localizeImageUrl(c.image_url) : (c.image_url ?? null),
        iconUrl:         c.icon_url ?? null,
        parentId:        c.parent_id ?? null,
        sortOrder:       c.sort_order ?? 0,
        metaTitle:       c.meta_title ?? null,
        metaDescription: c.meta_description ?? null,
        _count:          { products: 0 },
      }));

      return NextResponse.json({ data: await injectExtras(data), error: null });
    } catch (sbErr) {
      console.error('ERP Supabase categories error:', sbErr);
    }

    return NextResponse.json<ApiResponse<Category[]>>({ data: [], error: 'Failed to load categories' }, { status: 500 });
  }
}
