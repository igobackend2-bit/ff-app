import { NextResponse } from 'next/server';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; slot: string }> }) {
  const { id, slot } = await params;
  try {
    const res = await fetch(`${SB}/rest/v1/banners?id=eq.${id}&select=alt_text&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' });
    const rows: any[] = await res.json();
    if (!rows.length) return new NextResponse(null, { status: 404 });

    let dataUrl = '';
    try {
      const extra = JSON.parse(rows[0].alt_text ?? '{}');
      dataUrl = slot === '1' ? (extra.screenshot1 ?? '') : (extra.screenshot2 ?? '');
    } catch {}

    if (!dataUrl) return new NextResponse(null, { status: 404 });
    if (!dataUrl.startsWith('data:')) return NextResponse.redirect(dataUrl);

    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return new NextResponse(null, { status: 422 });
    const mime = dataUrl.slice(0, commaIdx).match(/data:([^;]+)/)?.[1] ?? 'image/png';
    const buffer = Buffer.from(dataUrl.slice(commaIdx + 1), 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: { 'Content-Type': mime, 'Content-Length': String(buffer.length), 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (err) {
    console.error('[banner screenshot]', err);
    return new NextResponse(null, { status: 500 });
  }
}
