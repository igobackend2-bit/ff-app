import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

function mapAddr(a: any) {
  return {
    id: a.id, userId: a.user_id, label: a.label, line1: a.line1, line2: a.line2 ?? null,
    landmark: a.landmark ?? null, city: a.city, state: a.state, pincode: a.pincode,
    lat: a.lat, lng: a.lng, isDefault: a.is_default,
    createdAt: a.created_at, updatedAt: a.updated_at,
  };
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ data: [] });
  try {
    const res = await fetch(
      `${SB}/rest/v1/addresses?user_id=eq.${userId}&order=is_default.desc,created_at.desc`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }
    );
    const rows: any[] = await res.json();
    return NextResponse.json({ data: rows.map(mapAddr) });
  } catch { return NextResponse.json({ data: [] }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId: string; label: string; line1: string; line2?: string;
      landmark?: string; city: string; state: string; pincode: string;
      lat?: number; lng?: number; isDefault?: boolean;
    };
    if (!body.userId || !body.line1 || !body.city || !body.pincode)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    if (body.isDefault) {
      await fetch(`${SB}/rest/v1/addresses?user_id=eq.${body.userId}`, {
        method: 'PATCH',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ is_default: false }),
      });
    }

    const res = await fetch(`${SB}/rest/v1/addresses`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: body.userId, label: body.label ?? 'Home',
        line1: body.line1, line2: body.line2 ?? null, landmark: body.landmark ?? null,
        city: body.city, state: body.state ?? '', pincode: body.pincode,
        lat: body.lat ?? 0, lng: body.lng ?? 0, is_default: body.isDefault ?? false,
      }),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ data: mapAddr(rows[0]) });
  } catch (err) {
    console.error('[addresses POST]', err);
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}
