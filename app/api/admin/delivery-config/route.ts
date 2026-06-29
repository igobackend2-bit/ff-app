// GET/POST /api/admin/delivery-config — read/write min_order_amount from Supabase app_config table
import { NextRequest, NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export const dynamic = 'force-dynamic';

const DEFAULT_MIN = 600;

export async function GET() {
  try {
    const res = await fetch(
      `${SB}/rest/v1/app_config?key=eq.min_order_amount&select=value&limit=1`,
      { headers: H, cache: 'no-store' },
    );
    if (res.ok) {
      const rows = await res.json() as Array<{ value: string }>;
      const val = rows[0]?.value;
      if (val) return NextResponse.json({ min_order_amount: Number(val) });
    }
  } catch { /* fall through */ }
  return NextResponse.json({ min_order_amount: DEFAULT_MIN });
}

export async function POST(req: NextRequest) {
  try {
    const { min_order_amount } = await req.json() as { min_order_amount: number };
    const amount = Number(min_order_amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Upsert into app_config table
    await fetch(`${SB}/rest/v1/app_config`, {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'min_order_amount', value: String(amount) }),
      cache: 'no-store',
    });

    return NextResponse.json({ ok: true, min_order_amount: amount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
