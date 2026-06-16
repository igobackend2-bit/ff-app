// Admin banners [id] — stored in ERP Supabase (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json() as {
      title?: string; headline?: string; subtitle?: string;
      ctaText?: string; imageUrl?: string; linkUrl?: string;
      bgGradient?: string; sortOrder?: number; isActive?: boolean;
      position?: string; videoUrl?: string; screenshot1?: string; screenshot2?: string;
    };

    // Fetch existing to merge altText
    const getRes = await fetch(`${SB}/rest/v1/banners?id=eq.${id}&select=alt_text`, { headers: H, cache: 'no-store' });
    let prev: Record<string, unknown> = {};
    if (getRes.ok) {
      const rows: any[] = await getRes.json();
      try { prev = JSON.parse(rows[0]?.alt_text ?? '{}') as Record<string, unknown>; } catch { /* */ }
    }

    const altText = JSON.stringify({
      headline:    body.headline    ?? prev['headline']    ?? '',
      subtitle:    body.subtitle    ?? prev['subtitle']    ?? '',
      ctaText:     body.ctaText     ?? prev['ctaText']     ?? 'Shop Now',
      bgGradient:  body.bgGradient  ?? prev['bgGradient']  ?? 'from-emerald-700 via-green-600 to-teal-600',
      videoUrl:    body.videoUrl    ?? prev['videoUrl']    ?? '',
      screenshot1: body.screenshot1 ?? prev['screenshot1'] ?? '',
      screenshot2: body.screenshot2 ?? prev['screenshot2'] ?? '',
    });

    const patch: Record<string, unknown> = { alt_text: altText };
    if (body.title     !== undefined) patch['title']      = body.title;
    if (body.imageUrl  !== undefined) patch['image_url']  = body.imageUrl;
    if (body.linkUrl   !== undefined) patch['link_url']   = body.linkUrl || null;
    if (body.sortOrder !== undefined) patch['sort_order'] = body.sortOrder;
    if (body.isActive  !== undefined) patch['is_active']  = body.isActive;
    if (body.position  !== undefined) patch['position']   = body.position;

    const res = await fetch(`${SB}/rest/v1/banners?id=eq.${id}`, {
      method: 'PATCH', headers: H, body: JSON.stringify(patch), cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    const rows: any[] = await res.json();
    const b = rows[0] ?? {};
    return NextResponse.json({ data: { id: b.id, title: b.title, imageUrl: b.image_url, altText: b.alt_text, linkUrl: b.link_url, sortOrder: b.sort_order, isActive: b.is_active, position: b.position } });
  } catch (err) {
    console.error('[PATCH /api/admin/banners/[id]]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const res = await fetch(`${SB}/rest/v1/banners?id=eq.${id}`, {
      method: 'DELETE', headers: H, cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/banners/[id]]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
