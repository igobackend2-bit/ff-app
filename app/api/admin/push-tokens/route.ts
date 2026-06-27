// Store / list Expo push tokens for broadcast notifications
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export const dynamic = 'force-dynamic';

// GET — return all registered push tokens (for admin broadcast)
export async function GET() {
  try {
    const res = await fetch(`${SB}/rest/v1/push_tokens?select=token&is_active=eq.true`, {
      headers: H, cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ tokens: [] });
    const rows = await res.json() as Array<{ token: string }>;
    return NextResponse.json({ tokens: rows.map((r) => r.token) });
  } catch {
    return NextResponse.json({ tokens: [] });
  }
}

// POST — register a push token from the APK
export async function POST(req: NextRequest) {
  try {
    const { token, platform } = await req.json() as { token: string; platform?: string };
    if (!token?.startsWith('ExponentPushToken[')) {
      return NextResponse.json({ error: 'invalid token' }, { status: 400 });
    }

    // Upsert: insert or update is_active=true
    await fetch(`${SB}/rest/v1/push_tokens`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ token, platform: platform ?? 'android', is_active: true, updated_at: new Date().toISOString() }),
      cache: 'no-store',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
