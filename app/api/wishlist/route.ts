import { NextRequest, NextResponse } from 'next/server';
import { db, isSupabaseConfigured } from '@/lib/supabase';
import type { ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json<ApiResponse<[]>>({ data: [], error: null });
  if (!isSupabaseConfigured) return NextResponse.json<ApiResponse<[]>>({ data: [], error: null });

  try {
    const rows = await db.getWishlist(userId);
    return NextResponse.json({ data: rows, error: null });
  } catch (err) {
    console.error('Wishlist GET error:', err);
    return NextResponse.json({ data: [], error: null });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 });
  if (!isSupabaseConfigured) return NextResponse.json({ data: null, error: null });

  try {
    const { productId } = (await req.json()) as { productId: string };
    await db.addToWishlist(userId, productId);
    return NextResponse.json({ data: { added: true }, error: null });
  } catch (err) {
    console.error('Wishlist POST error:', err);
    return NextResponse.json({ data: null, error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorised' }, { status: 401 });
  if (!isSupabaseConfigured) return NextResponse.json({ data: null, error: null });

  try {
    const { productId } = (await req.json()) as { productId: string };
    await db.removeFromWishlist(userId, productId);
    return NextResponse.json({ data: { removed: true }, error: null });
  } catch (err) {
    console.error('Wishlist DELETE error:', err);
    return NextResponse.json({ data: null, error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
