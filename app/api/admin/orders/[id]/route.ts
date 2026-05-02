// Admin: Update order status
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PICKING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
        address: true,
      },
    });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    console.error('[admin/orders/:id GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    const order = await prisma.order.update({
      where: { id: resolvedParams.id },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });

    return NextResponse.json({ order });
  } catch (err) {
    console.error('[admin/orders/:id PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
