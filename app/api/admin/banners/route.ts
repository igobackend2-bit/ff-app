// Admin banners — stored in ERP Supabase (no Prisma)
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

export async function GET() {
  try {
    const res = await fetch(`${SB}/rest/v1/banners?order=sort_order.asc,id.asc`, { headers: H, cache: 'no-store' });
    if (!res.ok) return NextResponse.json({ data: [] });
    const banners = await res.json();
    // Normalise snake_case → camelCase for the admin UI
    const data = (Array.isArray(banners) ? banners : []).map((b: any) => ({
      id:        b.id,
      title:     b.title      ?? '',
      imageUrl:  b.image_url  ?? b.imageUrl ?? '',
      altText:   b.alt_text   ?? b.altText  ?? '{}',
      linkUrl:   b.link_url   ?? b.linkUrl  ?? null,
      sortOrder: b.sort_order ?? b.sortOrder ?? 0,
      isActive:  b.is_active  ?? b.isActive  ?? true,
      position:  b.position   ?? 'hero',
    }));
    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/admin/banners]', err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      title: string; headline: string; subtitle: string;
      ctaText: string; imageUrl: string; linkUrl: string;
      bgGradient: string; sortOrder: number; isActive: boolean;
      position?: string; videoUrl?: string; screenshot1?: string; screenshot2?: string;
    };

    const altText = JSON.stringify({
      headline:    body.headline    ?? '',
      subtitle:    body.subtitle    ?? '',
      ctaText:     body.ctaText     ?? 'Shop Now',
      bgGradient:  body.bgGradient  ?? 'from-emerald-700 via-green-600 to-teal-600',
      videoUrl:    body.videoUrl    ?? '',
      screenshot1: body.screenshot1 ?? '',
      screenshot2: body.screenshot2 ?? '',
    });

    const res = await fetch(`${SB}/rest/v1/banners`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        title:      body.title     ?? 'New Banner',
        image_url:  body.imageUrl  ?? '',
        alt_text:   altText,
        link_url:   body.linkUrl   || null,
        position:   body.position  ?? 'hero',
        sort_order: body.sortOrder ?? 0,
        is_active:  body.isActive  ?? true,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      // Table may not exist yet — return helpful message
      if (err.includes('relation') || err.includes('does not exist') || res.status === 404) {
        return NextResponse.json({ error: 'Run the banners SQL setup first (see supabase-setup.sql)' }, { status: 503 });
      }
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const rows: any[] = await res.json();
    const b = rows[0] ?? {};
    return NextResponse.json({ data: { id: b.id, title: b.title, imageUrl: b.image_url, altText: b.alt_text, linkUrl: b.link_url, sortOrder: b.sort_order, isActive: b.is_active, position: b.position } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/banners]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
