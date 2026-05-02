import { NextResponse } from 'next/server';
import type { ApiResponse, Category } from '@/types';
import { db, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_CATEGORIES } from '@/lib/demo-data';

export const revalidate = 3600;

function formatCategory(c: Record<string, unknown>): Category {
  return {
    id: c['id'] as string,
    name: c['name'] as string,
    slug: c['slug'] as string,
    description: (c['description'] as string) ?? null,
    imageUrl: (c['image_url'] as string) ?? '',
    iconUrl: (c['icon_url'] as string) ?? null,
    parentId: (c['parent_id'] as string) ?? null,
    sortOrder: Number(c['sort_order']),
    metaTitle: (c['meta_title'] as string) ?? null,
    metaDescription: (c['meta_description'] as string) ?? null,
    ogImageUrl: (c['og_image_url'] as string) ?? null,
  };
}

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json<ApiResponse<Category[]>>({ data: DEMO_CATEGORIES, error: null });
    }
    const rows = await db.getCategories();
    return NextResponse.json<ApiResponse<Category[]>>({ data: rows.map(formatCategory), error: null });
  } catch (err) {
    console.error('Categories API error:', err);
    return NextResponse.json<ApiResponse<Category[]>>({ data: DEMO_CATEGORIES, error: null });
  }
}
