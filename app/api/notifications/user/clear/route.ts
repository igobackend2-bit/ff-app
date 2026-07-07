import { NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

// DELETE /api/notifications/user/clear — delete all broadcast notifications
export async function DELETE() {
  try {
    await fetch(
      `${SB}/rest/v1/notifications?type=neq.SYSTEM_CONFIG&type=neq.USER_PROFILE`,
      { method: 'DELETE', headers: H },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notif clear]', err);
    return NextResponse.json({ ok: false });
  }
}
