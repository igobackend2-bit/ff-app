// GET/POST /api/admin/delivery-config
// Stores min_order_amount — tries app_config table first, falls back to notifications table
// No SQL setup required for basic use
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const DEFAULT_MIN = 600;
const CONFIG_KEY  = 'min_order_amount';

export const dynamic = 'force-dynamic';

async function readConfig(): Promise<number> {
  // Try app_config table
  try {
    const r = await fetch(
      `${SB}/rest/v1/app_config?key=eq.${CONFIG_KEY}&select=value&limit=1`,
      { headers: H, cache: 'no-store' },
    );
    if (r.ok) {
      const rows = await r.json() as Array<{ value: string }>;
      if (rows[0]?.value) return Number(rows[0].value);
    }
  } catch { /* fall through */ }

  // Fallback: notifications table with type=SYSTEM_CONFIG
  try {
    const r = await fetch(
      `${SB}/rest/v1/notifications?type=eq.SYSTEM_CONFIG&title=eq.${CONFIG_KEY}&select=message&order=created_at.desc&limit=1`,
      { headers: H, cache: 'no-store' },
    );
    if (r.ok) {
      const rows = await r.json() as Array<{ message: string }>;
      if (rows[0]?.message) return Number(rows[0].message);
    }
  } catch { /* fall through */ }

  return DEFAULT_MIN;
}

export async function GET() {
  const min_order_amount = await readConfig();
  return NextResponse.json({ min_order_amount });
}

export async function POST(req: NextRequest) {
  try {
    const { min_order_amount } = await req.json() as { min_order_amount: number };
    const amount = Number(min_order_amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Try app_config table first (if SQL was run)
    let saved = false;
    try {
      const r = await fetch(`${SB}/rest/v1/app_config`, {
        method: 'POST',
        headers: { ...H, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ key: CONFIG_KEY, value: String(amount) }),
        cache: 'no-store',
      });
      if (r.status === 201 || r.status === 200 || r.ok) saved = true;
    } catch { /* fall through */ }

    if (!saved) {
      // Fallback: store in notifications table (no SQL required)
      await fetch(
        `${SB}/rest/v1/notifications?type=eq.SYSTEM_CONFIG&title=eq.${CONFIG_KEY}`,
        { method: 'DELETE', headers: H, cache: 'no-store' },
      ).catch(() => {});

      await fetch(`${SB}/rest/v1/notifications`, {
        method: 'POST',
        headers: { ...H, Prefer: 'return=minimal' },
        body: JSON.stringify({
          type: 'SYSTEM_CONFIG', title: CONFIG_KEY,
          message: String(amount), is_read: true, source: 'system',
        }),
        cache: 'no-store',
      });
    }

    return NextResponse.json({ ok: true, min_order_amount: amount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
