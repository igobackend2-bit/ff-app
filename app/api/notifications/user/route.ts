// GET /api/notifications/user — reads admin broadcast notifications from ERP Supabase
// (Prisma is disabled in production via DB_DISABLED=1, so we go direct to Supabase)
import { NextRequest, NextResponse } from 'next/server';

const SB   = 'https://qwiumswrbddwmlraktvy.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
// ff_user_notifications has RLS with no policies — anon reads return nothing.
const SKEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || ANON;
const H    = { apikey: ANON, Authorization: `Bearer ${ANON}` };
const SH   = { apikey: SKEY, Authorization: `Bearer ${SKEY}` };

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const uid = req.headers.get('x-user-id');

    // 1. Broadcast notifications (admin "Send Notification").
    const bRes = await fetch(
      `${SB}/rest/v1/notifications?select=*&type=neq.SYSTEM_CONFIG&type=neq.USER_PROFILE&user_id=is.null&order=created_at.desc&limit=20`,
      { headers: H, cache: 'no-store' },
    );
    const broadcast = bRes.ok ? await bRes.json() as Array<Record<string, unknown>> : [];

    // 2. This customer's own notifications (back-in-stock, etc.) — text-keyed table.
    let personal: Array<Record<string, unknown>> = [];
    if (uid) {
      const pUrl = `${SB}/rest/v1/ff_user_notifications?select=*&user_key=eq.${encodeURIComponent(uid)}&order=created_at.desc&limit=20`;
      const pRes = await fetch(pUrl, { headers: SH, cache: 'no-store' });
      const pText = await pRes.text();
      try { personal = JSON.parse(pText) as Array<Record<string, unknown>>; } catch { personal = []; }
      if (!pRes.ok || !Array.isArray(personal)) {
        console.warn('[notifications/user] personal fetch', pRes.status, pText.slice(0, 200));
        personal = [];
      }
    }

    const rows = [...personal, ...broadcast].sort(
      (a, b) => String(b['created_at'] ?? '').localeCompare(String(a['created_at'] ?? '')),
    );

    // Deduplicate: keep only the newest row per (type+title+message) combination
    const seen = new Set<string>();
    const notifications: Array<{
      id: string; type: string; title: string; message: string;
      isRead: boolean; createdAt: string; targetUserId: null; orderId: null;
    }> = [];
    for (const r of rows) {
      const key = `${r['type']}|${r['title']}|${r['message'] ?? r['body']}`;
      if (seen.has(key)) continue;
      seen.add(key);
      notifications.push({
        id:           String(r['id'] ?? ''),
        type:         String(r['type'] ?? 'INFO'),
        title:        String(r['title'] ?? ''),
        message:      String(r['message'] ?? r['body'] ?? ''),
        isRead:       Boolean(r['is_read']),
        createdAt:    String(r['created_at'] ?? ''),
        targetUserId: null,
        orderId:      null,
      });
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[notifications/user]', err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
