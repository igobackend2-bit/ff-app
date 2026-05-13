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
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to fetch category' },
      { status: 500 },
    );
  }
}
