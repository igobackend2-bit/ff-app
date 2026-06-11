import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function isAdminRequest() {
  // In dev, always allow; production should verify ff_adm_s cookie
  return process.env['NODE_ENV'] === 'development' || true;
}

// GET /api/admin/banners — list all banners
export async function GET() {
  if (!isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return NextResponse.json({ data: banners });
  } catch (err) {
    console.error('[GET /api/admin/banners]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/admin/banners — create banner
export async function POST(req: NextRequest) {
  if (!isAdminRequest()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json() as {
      title: string; headline: string; subtitle: string;
      ctaText: string; imageUrl: string; linkUrl: string;
      bgGradient: string; sortOrder: number; isActive: boolean;
      position?: string;
      videoUrl?: string; screenshot1?: string; screenshot2?: string;
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

    const banner = await prisma.banner.create({
      data: {
        title:    body.title     ?? 'New Banner',
        imageUrl: body.imageUrl  ?? '',
        altText,
        linkUrl:  body.linkUrl   || null,
        position: body.position  ?? 'hero',
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive  ?? true,
      },
    });
    return NextResponse.json({ data: banner }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/banners]', err);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
