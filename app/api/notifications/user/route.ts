// GET /api/notifications/user — reads admin broadcast notifications from ERP Supabase
// (Prisma is disabled in production via DB_DISABLED=1, so we go direct to Supabase)
import { NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(
      `${SB}/rest/v1/notifications?select=*&type=neq.SYSTEM_CONFIG&type=neq.USER_PROFILE&order=created_at.desc&limit=20`,
      { headers: H, cache: 'no-store' },
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.error('[notifications/user] Supabase error', res.status, errText);
      return NextResponse.json({ notifications: [], unreadCount: 0, _error: errText });
    }

    const rows = await res.json() as Array<Record<string, unknown>>;

    const notifications = rows.map((r) => ({
      id:           String(r['id'] ?? ''),
      type:         String(r['type'] ?? 'INFO'),
      title:        String(r['title'] ?? ''),
      message:      String(r['message'] ?? r['body'] ?? ''),
      isRead:       Boolean(r['is_read']),
      createdAt:    String(r['created_at'] ?? ''),
      targetUserId: null,
      orderId:      null,
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[notifications/user]', err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
