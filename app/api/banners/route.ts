import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export interface BannerSlide {
  id: string;
  title: string;         // badge
  headline: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;      // '' = no image, show gradient
  videoUrl: string;      // '' = no video
  screenshot1: string;   // optional mobile screenshot overlay
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

  // If video/screenshots are stored as base64 data URIs, replace with a
  // streaming endpoint URL so the JSON response stays small instead of 10-27 MB.
  const rawVideo = extra.videoUrl ?? '';
  const videoUrl = rawVideo.startsWith('data:')
    ? `/api/banners/${b.id}/video`
    : rawVideo;

  const rawSs1 = extra.screenshot1 ?? '';
  const rawSs2 = extra.screenshot2 ?? '';
  const screenshot1 = rawSs1.startsWith('data:') ? `/api/banners/${b.id}/screenshot/1` : rawSs1;
  const screenshot2 = rawSs2.startsWith('data:') ? `/api/banners/${b.id}/screenshot/2` : rawSs2;

  return {
    id:          b.id,
    title:       b.title,
    headline:    extra.headline   ?? b.title,
    subtitle:    extra.subtitle   ?? '',
    ctaText:     extra.ctaText    ?? 'Shop Now',
    ctaLink:     b.linkUrl        ?? '/',
    imageUrl:    b.imageUrl,
    videoUrl,
    screenshot1,
    screenshot2,
    bgGradient:  extra.bgGradient ?? 'from-emerald-700 via-green-600 to-teal-600',
    sortOrder:   b.sortOrder,
  };
}

// GET /api/banners?position=hero|promo  — public, active banners
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position') ?? 'hero';
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        position,
        OR: [
          { validFrom: null },
          { validFrom: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { validUntil: null },
              { validUntil: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, imageUrl: true, altText: true, linkUrl: true, sortOrder: true },
    });
    return NextResponse.json({ data: banners.map(parseBanner) });
  } catch (err) {
    console.error('[GET /api/banners]', err);
    return NextResponse.json({ data: [] });
  }
}
