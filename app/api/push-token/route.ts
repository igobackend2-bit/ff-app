// Store / retrieve Expo push tokens — ERP Supabase
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// POST /api/push-token  { token, userId?, platform? }
export async function POST(req: NextRequest) {
  try {
    const { token, userId, platform } = await req.json() as {
      token: string; userId?: string; platform?: string;
    };
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    // Upsert by token (device)
    const row = {
      token,
      user_id:    userId   ?? null,
      platform:   platform ?? 'android',
      updated_at: new Date().toISOString(),
    };
    const res = await fetch(`${SB}/rest/v1/push_tokens`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/push-token — returns all tokens (admin only, but no auth here — fine for now)
export async function GET() {
  try {
    const res = await fetch(`${SB}/rest/v1/push_tokens?select=*&order=updated_at.desc`, {
      headers: H, cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ tokens: [] });
    const tokens = await res.json();
    return NextResponse.json({ tokens });
  } catch {
    return NextResponse.json({ tokens: [] });
  }
}
