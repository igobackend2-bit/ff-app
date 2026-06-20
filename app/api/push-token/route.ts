// Store / retrieve Expo push tokens — ERP Supabase `device_tokens` table
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export const dynamic = 'force-dynamic';

// POST /api/push-token  { token, userId?, platform? }
export async function POST(req: NextRequest) {
  try {
    const { token, userId, platform } = await req.json() as {
      token: string; userId?: string; platform?: string;
    };
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    // device_tokens requires customer_id (NOT NULL) — use token as fallback identifier
    const row = {
      token,
      customer_id: userId ?? token,
      platform:    platform ?? 'android',
      is_active:   true,
      updated_at:  new Date().toISOString(),
    };
    const res = await fetch(`${SB}/rest/v1/device_tokens`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[push-token POST]', err);
      // Still return ok — push token failure should not break the app
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push-token POST]', err);
    return NextResponse.json({ ok: true });
  }
}

// GET /api/push-token — returns all active tokens (for admin push panel)
export async function GET() {
  try {
    const res = await fetch(
      `${SB}/rest/v1/device_tokens?select=*&is_active=eq.true&order=updated_at.desc`,
      { headers: H, cache: 'no-store' },
    );
    if (!res.ok) return NextResponse.json({ tokens: [] });
    const rows: Record<string, unknown>[] = await res.json();
    const tokens = rows.map((r) => ({
      token:      r['token'],
      customerId: r['customer_id'],
      platform:   r['platform'],
      isActive:   r['is_active'],
      updatedAt:  r['updated_at'],
    }));
    return NextResponse.json({ tokens });
  } catch {
    return NextResponse.json({ tokens: [] });
  }
}
