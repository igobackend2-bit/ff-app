import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

const ALLOWED_IMAGE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const isImage = ALLOWED_IMAGE.includes(file.type);
    const isVideo = ALLOWED_VIDEO.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Only images (JPG, PNG, WebP, GIF) or videos (MP4, WebM) are allowed.' }, { status: 400 });
    }
    if (isImage && file.size > MAX_IMAGE) {
      return NextResponse.json({ error: 'Image must be under 5 MB.' }, { status: 400 });
    }
    if (isVideo && file.size > MAX_VIDEO) {
      return NextResponse.json({ error: 'Video must be under 50 MB.' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext      = file.name.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg');
    const folder   = isVideo ? 'videos' : 'products';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Supabase Storage bucket "app-images"
    const uploadRes = await fetch(
      `${SB}/storage/v1/object/app-images/${filename}`,
      {
        method: 'POST',
        headers: {
          apikey:          KEY,
          Authorization:   `Bearer ${KEY}`,
          'Content-Type':  file.type,
          'x-upsert':      'true',
        },
        body: buffer,
      },
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      // Fallback: return base64 for small images only
      if (isImage && file.size <= 2 * 1024 * 1024) {
        const base64  = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        return NextResponse.json({ ok: true, url: dataUrl });
      }
      return NextResponse.json({ error: `Upload failed: ${errText}` }, { status: 500 });
    }

    const publicUrl = `${SB}/storage/v1/object/public/app-images/${filename}`;
    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error('[upload-media]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
