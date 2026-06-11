// GET /api/notifications/user  — returns order-status notifications for logged-in user
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

type RawNotif = {
  id: string; type: string; title: string; message: string;
  targetUserId: string | null; orderId: string | null;
  isAdminRead: number; isUserRead?: number; createdAt: string;
};

async function ensureTable() {
  // Create table with ALL columns including isUserRead from the start
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
  // Add isUserRead if table existed before without it
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE AppNotification ADD COLUMN isUserRead INTEGER NOT NULL DEFAULT 0`,
    );
  } catch { /* already exists — fine */ }
}

export async function GET() {
  try {
    const session = await auth();
    const userId  = (session?.user as { id?: string })?.id;
    if (!userId) return NextResponse.json({ notifications: [], unreadCount: 0 });

    await ensureTable();

    const rows = await prisma.$queryRawUnsafe<RawNotif[]>(
      `SELECT * FROM AppNotification WHERE (targetUserId = ? OR targetUserId IS NULL) ORDER BY createdAt DESC LIMIT 30`,
      userId,
    );

    // Unread count — isolated catch so notifications still show even if col is missing
    let unreadCount = 0;
    try {
      const unread = await prisma.$queryRawUnsafe<{ cnt: number }[]>(
        `SELECT COUNT(*) AS cnt FROM AppNotification WHERE (targetUserId = ? OR targetUserId IS NULL) AND isUserRead = 0`,
        userId,
      );
      unreadCount = Number(unread[0]?.cnt ?? 0);
    } catch {
      unreadCount = rows.length; // fallback: treat all as unread
    }

    return NextResponse.json({
      notifications: rows.map((r) => ({
        ...r,
        isRead: (r.isUserRead ?? 0) === 1,
      })),
      unreadCount,
    });
  } catch (err) {
    console.error('[notifications/user]', err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
