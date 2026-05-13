import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_IMAGE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_IMAGE = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO = 50 * 1024 * 1024;  // 50 MB

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

    // Unique timestamped filename to avoid collisions
    const ext      = path.extname(file.name).toLowerCase() || (isVideo ? '.mp4' : '.jpg');
    const base     = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-{2,}/g, '-').slice(0, 60);
    const safeName = `${base}-${Date.now()}${ext}`;

    const subDir = isVideo ? 'videos' : 'uploads';
    const dir    = path.join(process.cwd(), 'public', 'images', subDir);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, safeName), buffer);

    return NextResponse.json({ ok: true, url: `/images/${subDir}/${safeName}` });
  } catch (err) {
    console.error('[upload-media]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
