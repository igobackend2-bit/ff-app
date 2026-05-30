import { NextResponse } from 'next/server';

export interface BannerSlide {
  id: string;
  title: string;
  headline: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  videoUrl: string;
  screenshot1: string;
  screenshot2: string;
  bgGradient: string;
  sortOrder: number;
}

interface AltTextJson {
  headline?: string;
  subtitle?: string;
  ctaText?: string;
  bgGradient?: string;
  videoUrl?: string;
  screenshot1?: string;
  screenshot2?: string;
}

function parseBanner(b: {
  id: string; title: string; imageUrl: string;
  altText: string; linkUrl: string | null; sortOrder: number;
}): BannerSlide {
  let extra: AltTextJson = {};
  try { extra = JSON.parse(b.altText) as AltTextJson; } catch { /* use defaults */ }

  const rawVideo = extra.videoUrl ?? '';
  const videoUrl = rawVideo.startsWith('data:') ? `/api/banners/${b.id}/video` : rawVideo;
  const rawSs1 = extra.screenshot1 ?? '';
  const rawSs2 = extra.screenshot2 ?? '';
  const screenshot1 = rawSs1.startsWith('data:') ? `/api/banners/${b.id}/screenshot/1` : rawSs1;
  const screenshot2 = rawSs2.startsWith('data:') ? `/api/banners/${b.id}/screenshot/2` : rawSs2;

  return {
    id:         b.id,
    title:      b.title,
    headline:   extra.headline  ?? b.title,
    subtitle:   extra.subtitle  ?? '',
    ctaText:    extra.ctaText   ?? 'Shop Now',
    ctaLink:    b.linkUrl       ?? '/',
    imageUrl:   b.imageUrl,
    videoUrl,
    screenshot1,
    screenshot2,
    bgGradient: extra.bgGradient ?? 'from-emerald-700 via-green-600 to-teal-600',
    sortOrder:  b.sortOrder,
  };
}

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const SUPABASE_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

// GET /api/banners?position=hero|promo
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position') ?? 'hero';

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/banners?is_active=eq.true&position=eq.${position}&order=sort_order.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: 'no-store' }
    );
    const rows: any[] = await res.json();

    const banners = rows.map((b: any) => ({
      id: b.id, title: b.title, imageUrl: b.image_url,
      altText: b.alt_text ?? '{}', linkUrl: b.link_url, sortOrder: b.sort_order,
    }));

    return NextResponse.json({ data: banners.map(parseBanner) });
  } catch (err) {
    console.error('[GET /api/banners]', err);
    return NextResponse.json({ data: [] });
  }
}
