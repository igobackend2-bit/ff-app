import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER = process.env['ADMIN_USERNAME'] ?? 'ffadmin';
const ADMIN_PASS = process.env['ADMIN_PASSWORD'] ?? 'FF@admin2024';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };

    if (username?.trim() !== ADMIN_USER || password !== ADMIN_PASS) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('ff_adm_s', String(Date.now()), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2,
      secure: process.env['NODE_ENV'] === 'production',
    });
    res.cookies.set('ff_admin', '', { path: '/', maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ff_adm_s', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('ff_admin',  '', { path: '/', maxAge: 0 });
  return res;
}
