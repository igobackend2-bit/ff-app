import { NextResponse } from 'next/server';
import type { ApiResponse, Category } from '@/types';
import { prisma } from '@/lib/db';

export const revalidate = 0;

async function injectExtras(data: any[]): Promise<any[]> {
  const { getExtraCategories } = await import('@/lib/extra-products');
  const { localizeImageUrl }   = await import('@/lib/clean-name');
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

    // DB unreachable — proxy from the legacy live site
    try {
      const res = await fetch('https://ff-app-pi.vercel.app/api/categories', {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Category[] };
        if (json.data) {
          const { localizeImageUrl } = await import('@/lib/clean-name');
          json.data = json.data.map((c) => ({ ...c, imageUrl: c.imageUrl ? localizeImageUrl(c.imageUrl) : c.imageUrl }));
          return NextResponse.json({ data: await injectExtras(json.data), error: null });
        }
      }
    } catch { /* fall through */ }

    return NextResponse.json<ApiResponse<Category[]>>({ data: [], error: 'Failed to load categories' }, { status: 500 });
  }
}
