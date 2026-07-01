// PATCH /api/user/profile — persist the display name against the logged-in user's phone
// so it survives re-login (Prisma is DB_DISABLED in production, session alone won't persist it).
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveProfileName } from '@/lib/user-profile';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const phone = (session?.user as { phone?: string | null } | undefined)?.phone;
    if (!phone) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json() as { name?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await saveProfileName(phone, body.name.trim());
    return NextResponse.json({ ok: true, name: body.name.trim() });
  } catch (err) {
    console.error('[PATCH /api/user/profile]', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
