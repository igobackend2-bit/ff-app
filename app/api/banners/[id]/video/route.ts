import { NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export const dynamic = 'force-dynamic';

// GET /api/banners/[id]/video — serves the video stored as base64 in alt_text
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const res = await fetch(
      `${SB}/rest/v1/banners?id=eq.${id}&select=alt_text&limit=1`,
      { headers: H, cache: 'no-store' },
    );
    if (!res.ok) return new NextResponse(null, { status: 404 });

    const rows = await res.json() as Array<{ alt_text?: string }>;
    if (!rows[0]) return new NextResponse(null, { status: 404 });

    let videoUrl = '';
    try {
      const extra = JSON.parse(rows[0].alt_text ?? '{}') as { videoUrl?: string };
      videoUrl = extra.videoUrl ?? '';
    } catch {
      return new NextResponse(null, { status: 404 });
    }

    if (!videoUrl) return new NextResponse(null, { status: 404 });

    if (!videoUrl.startsWith('data:')) {
      return NextResponse.redirect(videoUrl);
    }

    const commaIdx = videoUrl.indexOf(',');
    if (commaIdx === -1) return new NextResponse(null, { status: 422 });

    const header    = videoUrl.slice(0, commaIdx);
    const b64       = videoUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime      = mimeMatch?.[1] ?? 'video/mp4';

    const buffer = Buffer.from(b64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':   mime,
        'Content-Length': String(buffer.length),
        'Cache-Control':  'public, max-age=86400, immutable',
        'Accept-Ranges':  'bytes',
      },
    });
  } catch (err) {
    console.error('[GET /api/banners/[id]/video]', err);
    return new NextResponse(null, { status: 500 });
  }
}
