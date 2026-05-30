import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json() as any;

    // Fetch existing alt_text to merge
    const existRes = await fetch(`${SB}/rest/v1/banners?id=eq.${id}&select=alt_text&limit=1`, { headers: H, cache: 'no-store' });
    const existRows: any[] = await existRes.json();
    let prev: any = {};
    try { prev = JSON.parse(existRows[0]?.alt_text ?? '{}'); } catch {}

    const alt_text = JSON.stringify({
      headline:    body.headline    ?? prev.headline    ?? '',
      subtitle:    body.subtitle    ?? prev.subtitle    ?? '',
      ctaText:     body.ctaText     ?? prev.ctaText     ?? 'Shop Now',
      bgGradient:  body.bgGradient  ?? prev.bgGradient  ?? 'from-emerald-700 via-green-600 to-teal-600',
      videoUrl:    body.videoUrl    ?? prev.videoUrl    ?? '',
      screenshot1: body.screenshot1 ?? prev.screenshot1 ?? '',
      screenshot2: body.screenshot2 ?? prev.screenshot2 ?? '',
    });

    const patch: any = { alt_text };
    if (body.title     !== undefined) patch.title      = body.title;
    if (body.imageUrl  !== undefined) patch.image_url  = body.imageUrl;
    if (body.linkUrl   !== undefined) patch.link_url   = body.linkUrl || null;
    if (body.sortOrder !== undefined) patch.sort_order = body.sortOrder;
    if (body.isActive  !== undefined) patch.is_active  = body.isActive;
    if (body.position  !== undefined) patch.position   = body.position;

    const res = await fetch(`${SB}/rest/v1/banners?id=eq.${id}`, {
      method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(patch),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('[PATCH /api/admin/banners/[id]]', err);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await fetch(`${SB}/rest/v1/banners?id=eq.${id}`, { method: 'DELETE', headers: H });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/banners/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
