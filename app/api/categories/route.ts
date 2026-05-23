import { NextResponse } from 'next/server';
import type { ApiResponse, Category } from '@/types';
import { prisma } from '@/lib/db';

export const revalidate = 0;

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

    return NextResponse.json({ data, error: null });
  } catch (err) {
    console.error('Categories API error:', err);
    return NextResponse.json<ApiResponse<Category[]>>({ data: [], error: 'Failed to load categories' }, { status: 500 });
  }
}
