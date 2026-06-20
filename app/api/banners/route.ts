// Public banners — reads from ERP Supabase (no Prisma / DB_DISABLED safe)
import { NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export const dynamic = 'force-dynamic';

export interface BannerSlide {
  id: string; title: string; headline: string; subtitle: string;
  ctaText: string; ctaLink: string; imageUrl: string; videoUrl: string;
  screenshot1: string; screenshot2: string; bgGradient: string; sortOrder: number;
}

interface AltTextJson {
  headline?: string; subtitle?: string; ctaText?: string;
  bgGradient?: string; videoUrl?: string; screenshot1?: string; screenshot2?: string;
}

function parseBanner(b: Record<string, unknown>): BannerSlide {
  let extra: AltTextJson = {};
  try { extra = JSON.parse(String(b['alt_text'] ?? '{}')); } catch { /* defaults */ }

  const rawVideo = extra.videoUrl ?? '';
  const rawSs1   = extra.screenshot1 ?? '';
  const rawSs2   = extra.screenshot2 ?? '';

  return {
    id:          String(b['id']),
    title:       String(b['title'] ?? ''),
    headline:    extra.headline  ?? String(b['title'] ?? ''),
    subtitle:    extra.subtitle  ?? '',
    ctaText:     extra.ctaText   ?? 'Shop Now',
    ctaLink:     String(b['link_url'] ?? '/'),
    imageUrl:    String(b['image_url'] ?? ''),
    videoUrl:    rawVideo.startsWith('data:')   ? `/api/banners/${b['id']}/video`          : rawVideo,
    screenshot1: rawSs1.startsWith('data:')     ? `/api/banners/${b['id']}/screenshot/1`   : rawSs1,
    screenshot2: rawSs2.startsWith('data:')     ? `/api/banners/${b['id']}/screenshot/2`   : rawSs2,
    bgGradient:  extra.bgGradient ?? 'from-emerald-700 via-green-600 to-teal-600',
    sortOrder:   Number(b['sort_order'] ?? 0),
  };
}

// GET /api/banners?position=hero|promo  — public, active banners
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position') ?? 'hero';

    const res = await fetch(
      `${SB}/rest/v1/banners?is_active=eq.true&position=eq.${position}&order=sort_order.asc`,
      { headers: H, cache: 'no-store' },
    );

    if (!res.ok) {
      console.error('[GET /api/banners] Supabase error', res.status, await res.text());
      return NextResponse.json({ data: [] });
    }

    const rows: Record<string, unknown>[] = await res.json();
    return NextResponse.json({ data: (Array.isArray(rows) ? rows : []).map(parseBanner) });
  } catch (err) {
    console.error('[GET /api/banners]', err);
    return NextResponse.json({ data: [] });
  }
}
