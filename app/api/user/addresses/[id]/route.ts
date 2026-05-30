import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as any;

    if (body.isDefault && body.userId) {
      await fetch(`${SB}/rest/v1/addresses?user_id=eq.${body.userId}`, {
        method: 'PATCH',
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ is_default: false }),
      });
    }

    const patch: any = {};
    if (body.label     !== undefined) patch.label      = body.label;
    if (body.line1     !== undefined) patch.line1      = body.line1;
    if (body.line2     !== undefined) patch.line2      = body.line2;
    if (body.landmark  !== undefined) patch.landmark   = body.landmark;
    if (body.city      !== undefined) patch.city       = body.city;
    if (body.state     !== undefined) patch.state      = body.state;
    if (body.pincode   !== undefined) patch.pincode    = body.pincode;
    if (body.lat       !== undefined) patch.lat        = body.lat;
    if (body.lng       !== undefined) patch.lng        = body.lng;
    if (body.isDefault !== undefined) patch.is_default = body.isDefault;

    const res = await fetch(`${SB}/rest/v1/addresses?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('[addresses PATCH]', err);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await fetch(`${SB}/rest/v1/addresses?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[addresses DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
