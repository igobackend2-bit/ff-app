import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const addressSchema = z.object({
  fullName: z.string().min(2),
  phone:    z.string().min(10),
  line1:    z.string().min(5),
  city:     z.string().min(2),
  state:    z.string().min(2),
  pincode:  z.string().min(6).max(6),
});

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity:  z.number().int().positive(),
  })).min(1),
  paymentMethod: z.enum(['COD', 'RAZORPAY']).default('COD'),
  address:       addressSchema,
  couponCode:    z.string().optional(),
});

// ── GET /api/orders ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth();
    const userId  = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ data: [], error: 'Not authenticated' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    50,
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrls: true, unit: true, slug: true } },
          },
        },
        address: true,
      },
    });

    const formatted = orders.map((o) => ({
      id:            o.id,
      orderNumber:   o.orderNumber,
      status:        o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal:      o.subtotal,
      deliveryFee:   o.deliveryFee,
      total:         o.total,
      createdAt:     o.createdAt,
      address:       o.address,
      items:         o.items.map((item) => {
        let imgs: string[] = [];
        try { imgs = JSON.parse(item.product.imageUrls as string) as string[]; }
        catch { imgs = item.product.imageUrls ? [item.product.imageUrls as string] : []; }
        return {
          id:        item.id,
          name:      item.product.name,
          unit:      item.product.unit,
          slug:      item.product.slug,
          imageUrls: imgs,
          quantity:  item.quantity,
          unitPrice: item.unitPrice,
        };
      }),
    }));

    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ data: [], error: 'Server error' }, { status: 500 });
  }
}

// ── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId  = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
    }

    const { items, paymentMethod, address } = parsed.data;

    // Verify all products exist in DB
    const productIds = items.map((i) => i.productId);
    const products   = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, inStock: true },
    });

    if (products.length !== productIds.length) {
      const foundIds   = new Set(products.map((p) => p.id));
      const missingIds = productIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: 'Some items in your cart are no longer available. Please clear your cart and add fresh items.', missingIds },
        { status: 422 },
      );
    }

    const priceMap: Record<string, number> = {};
    for (const p of products) priceMap[p.id] = p.price;

    const subtotal    = items.reduce((sum, i) => sum + (priceMap[i.productId] ?? 0) * i.quantity, 0);
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const total       = subtotal + deliveryFee;
    const orderNumber = 'FF' + Date.now().toString().slice(-8);

    // Create address record first (Prisma unchecked input requires addressId)
    const newAddress = await prisma.address.create({
      data: {
        userId,
        label:     address.fullName + ' - ' + address.line1.slice(0, 20),
        line1:     address.line1,
        city:      address.city,
        state:     address.state,
        pincode:   address.pincode,
        lat:       0,
        lng:       0,
        isDefault: false,
      },
    });

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId:     newAddress.id,
        status:        'PLACED',
        paymentMethod,
        paymentStatus: 'PENDING',
        subtotal,
        deliveryFee,
        total,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity:  i.quantity,
            unitPrice: priceMap[i.productId] ?? 0,
            total:     (priceMap[i.productId] ?? 0) * i.quantity,
          })),
        },
      },
      include: { items: true, address: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}
