import { NextRequest, NextResponse } from 'next/server';

const SESSION_MS = 60 * 60 * 2 * 1000; // 2 hours

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('ff_adm_s');
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const loginTime = parseInt(cookie.value, 10);
  if (!loginTime || Date.now() - loginTime > SESSION_MS) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
