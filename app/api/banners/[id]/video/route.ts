import { NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${SB}/rest/v1/banners?id=eq.${id}&select=alt_text&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' });
    const rows: any[] = await res.json();
    if (!rows.length) return new NextResponse(null, { status: 404 });

    let videoUrl = '';
    try { videoUrl = JSON.parse(rows[0].alt_text ?? '{}').videoUrl ?? ''; } catch {}

    if (!videoUrl) return new NextResponse(null, { status: 404 });
    if (!videoUrl.startsWith('data:')) return NextResponse.redirect(videoUrl);

    // base64 data URI — decode and stream
    const commaIdx = videoUrl.indexOf(',');
    if (commaIdx === -1) return new NextResponse(null, { status: 422 });
    const mime = videoUrl.slice(0, commaIdx).match(/data:([^;]+)/)?.[1] ?? 'video/mp4';
    const buffer = Buffer.from(videoUrl.slice(commaIdx + 1), 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': mime, 'Content-Length': String(buffer.length), 'Cache-Control': 'public, max-age=86400', 'Accept-Ranges': 'bytes' },
    });
  } catch (err) {
    console.error('[banner video]', err);
    return new NextResponse(null, { status: 500 });
  }
}
