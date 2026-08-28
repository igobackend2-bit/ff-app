// Check whether a phone number is already registered
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProfileName } from '@/lib/user-profile';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')?.trim();

  if (!phone || !/^\+91[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: 'Valid phone number required (+91XXXXXXXXXX)' }, { status: 400 });
  }

  // Primary source of truth: the name saved against this phone in Supabase
  // (customer_profiles / notifications / last order). Prisma is offline in prod,
  // so this — not the Prisma lookup — is what makes a returning user "known".
  try {
    const name = await getProfileName(phone);
    if (name) return NextResponse.json({ exists: true, name });
  } catch { /* fall through to Prisma / new-user */ }

  try {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true },
    });
    return NextResponse.json({ exists: !!user, name: user?.name ?? null });
  } catch (err) {
    console.warn('[check-user] DB unavailable:', String(err).slice(0, 150));
    // DB down and no saved profile — treat as new user so signup can proceed
    return NextResponse.json({ exists: false, name: null });
  }
}
