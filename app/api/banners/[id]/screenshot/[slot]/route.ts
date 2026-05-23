import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/banners/[id]/screenshot/[slot] — streams screenshot 1 or 2 for a banner
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; slot: string }> },
) {
  const { id, slot } = await params;

  try {
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { altText: true },
    });

    if (!banner) return new NextResponse(null, { status: 404 });

    let dataUrl = '';
    try {
      const extra = JSON.parse(banner.altText) as { screenshot1?: string; screenshot2?: string };
      dataUrl = slot === '1' ? (extra.screenshot1 ?? '') : (extra.screenshot2 ?? '');
    } catch {
      return new NextResponse(null, { status: 404 });
    }

    if (!dataUrl) return new NextResponse(null, { status: 404 });

    if (!dataUrl.startsWith('data:')) {
      return NextResponse.redirect(dataUrl);
    }

    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return new NextResponse(null, { status: 422 });

    const header = dataUrl.slice(0, commaIdx);
    const b64    = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] ?? 'image/png';

    const buffer = Buffer.from(b64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err) {
    console.error('[GET /api/banners/[id]/screenshot/[slot]]', err);
    return new NextResponse(null, { status: 500 });
  }
}
