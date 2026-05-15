// GET /api/admin/orders/product-summary
// Returns total quantity ordered per product (for a date range + status filter)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? '';  // optional status filter
    const from   = searchParams.get('from')   ?? '';  // ISO date string
    const to     = searchParams.get('to')     ?? '';  // ISO date string

    // Build order filter
    const orderWhere: Record<string, unknown> = {};
    if (status) orderWhere['status'] = status;
    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) createdAt['gte'] = new Date(from);
      if (to)   createdAt['lte'] = new Date(to + 'T23:59:59Z');
      orderWhere['createdAt'] = createdAt;
    }

    // Fetch all order items for matching orders, grouped by product
    const items = await prisma.orderItem.findMany({
      where: { order: orderWhere },
      include: {
        product: { select: { id: true, name: true, unit: true, imageUrls: true, price: true } },
        order:   { select: { status: true, createdAt: true } },
      },
    });

    // Aggregate by product
    const map = new Map<string, {
      productId: string; name: string; unit: string; imageUrls: string;
      totalQty: number; totalRevenue: number; orderCount: number;
    }>();

    for (const item of items) {
      const key = item.productId;
      if (!map.has(key)) {
        map.set(key, {
          productId:    item.product.id,
          name:         item.product.name,
          unit:         item.product.unit,
          imageUrls:    item.product.imageUrls,
          totalQty:     0,
          totalRevenue: 0,
          orderCount:   0,
        });
      }
      const entry = map.get(key)!;
      entry.totalQty     += item.quantity;
      entry.totalRevenue += item.total;
      entry.orderCount   += 1;
    }

    const summary = Array.from(map.values())
      .sort((a, b) => b.totalQty - a.totalQty); // most ordered first

    return NextResponse.json({ summary, total: summary.length });
  } catch (err) {
    console.error('[orders/product-summary]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
