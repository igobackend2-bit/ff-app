import { NextRequest, NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

function fmtBanner(b: any) {
  let extra: any = {};
  try { extra = JSON.parse(b.alt_text ?? '{}'); } catch {}
  return {
    id: b.id, title: b.title, imageUrl: b.image_url, altText: b.alt_text,
    linkUrl: b.link_url, position: b.position, sortOrder: b.sort_order,
    isActive: b.is_active, validFrom: b.valid_from, validUntil: b.valid_until,
    headline: extra.headline ?? '', subtitle: extra.subtitle ?? '',
    ctaText: extra.ctaText ?? 'Shop Now', bgGradient: extra.bgGradient ?? '',
    videoUrl: extra.videoUrl ?? '', screenshot1: extra.screenshot1 ?? '', screenshot2: extra.screenshot2 ?? '',
  };
}

export async function GET() {
  try {
    const res = await fetch(`${SB}/rest/v1/banners?order=sort_order.asc,id.asc`, { headers: H, cache: 'no-store' });
    const rows: any[] = await res.json();
    return NextResponse.json({ data: rows.map(fmtBanner) });
  } catch (err) {
    console.error('[GET /api/admin/banners]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as any;
    const altText = JSON.stringify({
      headline: body.headline ?? '', subtitle: body.subtitle ?? '',
      ctaText: body.ctaText ?? 'Shop Now', bgGradient: body.bgGradient ?? '',
      videoUrl: body.videoUrl ?? '', screenshot1: body.screenshot1 ?? '', screenshot2: body.screenshot2 ?? '',
    });
    const res = await fetch(`${SB}/rest/v1/banners`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify({
        title: body.title ?? body.headline ?? '', image_url: body.imageUrl ?? '',
        alt_text: altText, link_url: body.linkUrl ?? '/',
        position: body.position ?? 'hero', sort_order: body.sortOrder ?? 0,
        is_active: body.isActive ?? true,
      }),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ data: fmtBanner(rows[0]) }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/banners]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
