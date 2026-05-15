import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RawNotif = {
  id: string; type: string; title: string; message: string;
  targetUserId: string | null; orderId: string | null;
  isAdminRead: number; createdAt: string;
};

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS AppNotification (
      id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'INFO',
      title TEXT NOT NULL, message TEXT NOT NULL,
      targetUserId TEXT, orderId TEXT,
      isAdminRead INTEGER NOT NULL DEFAULT 0,
      isUserRead  INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    )
  `);
  try { await prisma.$executeRawUnsafe(`ALTER TABLE AppNotification ADD COLUMN isUserRead INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();
    const limit = Number(new URL(req.url).searchParams.get('limit') ?? '60');

    const rows = await prisma.$queryRawUnsafe<RawNotif[]>(
      `SELECT * FROM AppNotification ORDER BY createdAt DESC LIMIT ?`, limit,
    );
    const unread = await prisma.$queryRawUnsafe<{ cnt: number }[]>(
      `SELECT COUNT(*) AS cnt FROM AppNotification WHERE isAdminRead = 0`,
    );

    return NextResponse.json({
      notifications: rows.map((r) => ({ ...r, isAdminRead: r.isAdminRead === 1 })),
      unreadCount:   Number(unread[0]?.cnt ?? 0),
    });
  } catch (err) {
    console.error('[notifications GET]', err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const body = await req.json() as {
      type?: string; title: string; message: string;
      targetUserId?: string; orderId?: string;
    };
    if (!body.title?.trim() || !body.message?.trim()) {
      return NextResponse.json({ error: 'title and message required' }, { status: 400 });
    }
    const id = 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    await prisma.$executeRawUnsafe(
      `INSERT INTO AppNotification (id,type,title,message,targetUserId,orderId,isAdminRead,isUserRead,createdAt)
       VALUES (?,?,?,?,?,?,0,0,?)`,
      id, body.type ?? 'PROMO', body.title, body.message,
      body.targetUserId ?? null, body.orderId ?? null, new Date().toISOString(),
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[notifications POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await ensureTable();
    await prisma.$executeRawUnsafe(`DELETE FROM AppNotification WHERE isAdminRead = 1`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
