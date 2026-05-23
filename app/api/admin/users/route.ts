import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(50, Number(searchParams.get('limit') ?? 20));
    const q     = searchParams.get('q') ?? '';

    const where = q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id:            true,
          name:          true,
          email:         true,
          phone:         true,
          createdAt:     true,
          loyaltyPoints: true,
          _count: { select: { orders: true } },
          addresses: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
            select: { id: true, label: true, line1: true, city: true, state: true, pincode: true, isDefault: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
