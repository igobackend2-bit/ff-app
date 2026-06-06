import { NextRequest, NextResponse } from 'next/server';

const SB  = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  const phone = req.nextUrl.searchParams.get('phone')?.trim();

  try {
    let rows: { id: string; name: string | null }[] = [];

    if (email && email.includes('@')) {
      const res = await fetch(
        `${SB}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,name&limit=1`,
        { headers: sbH, cache: 'no-store' },
      );
      rows = await res.json();
    } else if (phone) {
      // normalise to +91XXXXXXXXXX
      const normalised = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const res = await fetch(
        `${SB}/rest/v1/users?phone=eq.${encodeURIComponent(normalised)}&select=id,name&limit=1`,
        { headers: sbH, cache: 'no-store' },
      );
      rows = await res.json();
    } else {
      return NextResponse.json({ error: 'email or phone required' }, { status: 400 });
    }

    return NextResponse.json({ exists: rows.length > 0, name: rows[0]?.name ?? null });
  } catch (err) {
    console.error('[check-user]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
