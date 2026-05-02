import { NextResponse } from 'next/server';
import { db, isSupabaseConfigured } from '@/lib/supabase';

export const revalidate = 30;

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        data: { products: 20, outOfStock: 0, inStock: 20, orders: 0, pendingOrders: 0, users: 0, totalRevenue: 0, recentOrders: 0 },
        error: null,
      });
    }
    const stats = await db.getAdminStats();
    return NextResponse.json({ data: { ...stats, inStock: stats.products - stats.outOfStock }, error: null });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ data: null, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
