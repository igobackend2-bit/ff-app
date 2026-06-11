// Check whether a phone number is already registered
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')?.trim();

  if (!phone || !/^\+91[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: 'Valid phone number required (+91XXXXXXXXXX)' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true },
    });

    return NextResponse.json({ exists: !!user, name: user?.name ?? null });
  } catch (err) {
    console.warn('[check-user] DB unavailable:', String(err).slice(0, 150));
    // DB down — treat as new user so login can proceed via stateless OTP
    return NextResponse.json({ exists: false, name: null });
  }
}
