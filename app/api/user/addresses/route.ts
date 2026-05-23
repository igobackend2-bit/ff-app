import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET  /api/user/addresses?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ data: [] });
  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ data: addresses });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

// POST /api/user/addresses
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId: string; label: string; line1: string; line2?: string;
      landmark?: string; city: string; state: string; pincode: string;
      lat?: number; lng?: number; isDefault?: boolean;
    };
    if (!body.userId || !body.line1 || !body.city || !body.pincode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: body.userId }, data: { isDefault: false } });
    }
    const addr = await prisma.address.create({
      data: {
        userId:    body.userId,
        label:     body.label ?? 'Home',
        line1:     body.line1,
        line2:     body.line2 ?? null,
        landmark:  body.landmark ?? null,
        city:      body.city,
        state:     body.state ?? '',
        pincode:   body.pincode,
        lat:       body.lat ?? 0,
        lng:       body.lng ?? 0,
        isDefault: body.isDefault ?? false,
      },
    });
    return NextResponse.json({ data: addr });
  } catch (err) {
    console.error('[addresses POST]', err);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}
