import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const session = await auth();
    const userId  = (session?.user as { id?: string })?.id;
    if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

    // Mark both user-specific and broadcast (targetUserId IS NULL) notifications as read
    await prisma.$executeRawUnsafe(
      `UPDATE AppNotification SET isUserRead = 1 WHERE targetUserId = ? OR targetUserId IS NULL`,
      userId,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
