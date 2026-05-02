import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  couponCode: z.string().optional(),
});

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db');
    // In production: get userId from session
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrls: true, unit: true, slug: true } },
          },
        },
        address: true,
      },
    });
    return NextResponse.json({ data: orders, error: null });
  } catch {
    return NextResponse.json({ data: [], error: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }
    // In production: create Razorpay order here, return razorpayOrderId
    const mockOrderId = `order_${Date.now()}`;
    return NextResponse.json({
      data: { orderId: mockOrderId, razorpayOrderId: `rzp_${mockOrderId}` },
      error: null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
