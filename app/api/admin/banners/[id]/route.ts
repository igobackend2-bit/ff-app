import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/admin/banners/[id]
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
      position?: string;
      videoUrl?: string; screenshot1?: string; screenshot2?: string;
    };

    // Fetch existing altText to merge
    const existing = await prisma.banner.findUnique({ where: { id }, select: { altText: true } });
    let prev: Record<string, unknown> = {};
    try { prev = JSON.parse(existing?.altText ?? '{}') as Record<string, unknown>; } catch { /* */ }

    const altText = JSON.stringify({
      headline:    body.headline    ?? prev['headline']    ?? '',
      subtitle:    body.subtitle    ?? prev['subtitle']    ?? '',
      ctaText:     body.ctaText     ?? prev['ctaText']     ?? 'Shop Now',
      bgGradient:  body.bgGradient  ?? prev['bgGradient']  ?? 'from-emerald-700 via-green-600 to-teal-600',
      videoUrl:    body.videoUrl    ?? prev['videoUrl']    ?? '',
      screenshot1: body.screenshot1 ?? prev['screenshot1'] ?? '',
      screenshot2: body.screenshot2 ?? prev['screenshot2'] ?? '',
    });

    const updated = await prisma.banner.update({
      where: { id },
      data: {
        ...(body.title     !== undefined && { title: body.title }),
        ...(body.imageUrl  !== undefined && { imageUrl: body.imageUrl }),
        ...(body.linkUrl   !== undefined && { linkUrl: body.linkUrl || null }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive  !== undefined && { isActive: body.isActive }),
        ...(body.position  !== undefined && { position: body.position }),
        altText,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /api/admin/banners/[id]]', err);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE /api/admin/banners/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/banners/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
