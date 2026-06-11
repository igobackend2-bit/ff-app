import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/banners/[id]/video — streams the stored video for a banner
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { altText: true },
    });

    if (!banner) return new NextResponse(null, { status: 404 });

    let videoUrl = '';
    try {
      const extra = JSON.parse(banner.altText) as { videoUrl?: string };
      videoUrl = extra.videoUrl ?? '';
    } catch {
      return new NextResponse(null, { status: 404 });
    }

    if (!videoUrl) return new NextResponse(null, { status: 404 });

    // External URL — redirect the browser to it directly
    if (!videoUrl.startsWith('data:')) {
      return NextResponse.redirect(videoUrl);
    }

    // Base64 data URI — decode and stream as binary
    const commaIdx = videoUrl.indexOf(',');
    if (commaIdx === -1) return new NextResponse(null, { status: 422 });

    const header = videoUrl.slice(0, commaIdx);
    const b64    = videoUrl.slice(commaIdx + 1);

    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] ?? 'video/mp4';

    const buffer = Buffer.from(b64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=86400, immutable',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err) {
    console.error('[GET /api/banners/[id]/video]', err);
    return new NextResponse(null, { status: 500 });
  }
}
