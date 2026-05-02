import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Category } from '@/types';
import { db, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_CATEGORIES } from '@/lib/demo-data';

export const revalidate = 3600;

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!isSupabaseConfigured) {
      const cat = DEMO_CATEGORIES.find((c) => c.slug === slug);
      if (!cat) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ data: cat, error: null });
    }

    const raw = await db.getCategoryBySlug(slug);
    if (!raw) return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Category not found' }, { status: 404 });

    const category: Category = {
      id: raw['id'] as string,
      name: raw['name'] as string,
      slug: raw['slug'] as string,
      description: (raw['description'] as string) ?? null,
      imageUrl: (raw['image_url'] as string) ?? '',
      iconUrl: (raw['icon_url'] as string) ?? null,
      parentId: (raw['parent_id'] as string) ?? null,
      sortOrder: Number(raw['sort_order']),
      metaTitle: (raw['meta_title'] as string) ?? null,
      metaDescription: (raw['meta_description'] as string) ?? null,
      ogImageUrl: (raw['og_image_url'] as string) ?? null,
    };
    return NextResponse.json({ data: category, error: null });
  } catch (err) {
    console.error('Category slug API error:', err);
    return NextResponse.json<ApiResponse<null>>({ data: null, error: 'Failed to fetch category' }, { status: 500 });
  }
}
