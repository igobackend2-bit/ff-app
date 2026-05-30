import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email || !email.includes('@'))
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });

  try {
    const res = await fetch(
      `${SB}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,name&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }
    );
    const rows: any[] = await res.json();
    return NextResponse.json({ exists: rows.length > 0, name: rows[0]?.name ?? null });
  } catch (err) {
    console.error('[check-user]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
