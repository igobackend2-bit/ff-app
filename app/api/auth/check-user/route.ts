// Check whether an email is already registered
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    return NextResponse.json({ exists: !!user, name: user?.name ?? null });
  } catch (err) {
    console.error('[check-user]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
