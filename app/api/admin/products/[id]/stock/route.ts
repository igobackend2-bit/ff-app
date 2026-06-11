// Admin: Toggle product stock status (in-stock / out-of-stock)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const inStock = Boolean(body.inStock);

    const product = await prisma.product.update({
      where: { id: resolvedParams.id },
      data: { inStock },
      select: { id: true, name: true, inStock: true },
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error('[admin/products/:id/stock PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
