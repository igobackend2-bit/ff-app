import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const revalidate = 30;

export async function GET() {
  try {
    const [
      totalProducts,
      outOfStock,
      totalOrders,
      pendingOrders,
      totalUsers,
      revenueData,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { inStock: false } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    return NextResponse.json({
      data: {
        products: totalProducts,
        outOfStock,
        inStock: totalProducts - outOfStock,
        orders: totalOrders,
        pendingOrders,
        recentOrders,
        users: totalUsers,
        totalRevenue: revenueData._sum.total ?? 0,
      },
      error: null,
    });
  } catch (err) {
    console.error('[admin/stats GET]', err);
    // Return safe defaults so the dashboard still renders
    return NextResponse.json({
      data: { products: 0, outOfStock: 0, inStock: 0, orders: 0, pendingOrders: 0, recentOrders: 0, users: 0, totalRevenue: 0 },
      error: null,
    });
  }
}
