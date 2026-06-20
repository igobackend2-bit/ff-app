// Admin notifications — uses ERP Supabase (no Prisma / DB_DISABLED safe)
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const limit = Number(new URL(req.url).searchParams.get('limit') ?? '60');

    const [notifRes, unreadRes] = await Promise.all([
      fetch(`${SB}/rest/v1/app_notifications?select=*&order=created_at.desc&limit=${limit}`, {
        headers: H, cache: 'no-store',
      }),
      fetch(`${SB}/rest/v1/app_notifications?select=id&is_admin_read=eq.false`, {
        headers: { ...H, Prefer: 'count=exact' }, cache: 'no-store',
      }),
    ]);

    const rows: Record<string, unknown>[] = notifRes.ok ? await notifRes.json() : [];
    const rangeHeader = unreadRes.headers.get('content-range');
    const unreadCount = rangeHeader ? parseInt(rangeHeader.split('/')[1] ?? '0', 10) : 0;

    const notifications = rows.map((r) => ({
      id:           r['id'],
      type:         r['type']           ?? 'INFO',
      title:        r['title']          ?? '',
      message:      r['message']        ?? '',
      targetUserId: r['target_user_id'] ?? null,
      orderId:      r['order_id']       ?? null,
      isAdminRead:  Boolean(r['is_admin_read']),
      createdAt:    r['created_at']     ?? '',
    }));

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[notifications GET]', err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type?: string; title: string; message: string;
      targetUserId?: string; orderId?: string;
      sendPush?: boolean; pushTokens?: string[];
    };
    if (!body.title?.trim() || !body.message?.trim()) {
      return NextResponse.json({ error: 'title and message required' }, { status: 400 });
    }

    const id = 'n-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const row = {
      id,
      type:           body.type ?? 'PROMO',
      title:          body.title,
      message:        body.message,
      target_user_id: body.targetUserId ?? null,
      order_id:       body.orderId      ?? null,
      is_admin_read:  false,
      is_user_read:   false,
      created_at:     new Date().toISOString(),
    };

    const insertRes = await fetch(`${SB}/rest/v1/app_notifications`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify(row),
      cache: 'no-store',
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      // Table may not exist yet — return a helpful error
      return NextResponse.json({ error: `Supabase error: ${errText}` }, { status: 500 });
    }

    // Send push notifications via Expo Push API if tokens supplied
    let pushResult: unknown = null;
    const tokens: string[] = body.pushTokens ?? [];
    if (tokens.length > 0) {
      try {
        const messages = tokens.map((to) => ({
          to,
          sound: 'default',
          title: body.title,
          body:  body.message,
          data:  { type: body.type ?? 'PROMO', notifId: id },
        }));
        const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate' },
          body: JSON.stringify(messages),
        });
        pushResult = await pushRes.json();
      } catch (pushErr) {
        console.error('[notifications push]', pushErr);
      }
    }

    return NextResponse.json({ ok: true, id, pushResult });
  } catch (err) {
    console.error('[notifications POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await fetch(`${SB}/rest/v1/app_notifications?is_admin_read=eq.true`, {
      method: 'DELETE',
      headers: H,
      cache: 'no-store',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
