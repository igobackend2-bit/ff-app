// One-time setup: create push_tokens and app_notifications tables in ERP Supabase
import { NextResponse } from 'next/server';

const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H   = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export async function GET() {
  const results: Record<string, string> = {};

  // Create push_tokens table via RPC (raw SQL)
  const pushSql = `
    CREATE TABLE IF NOT EXISTS push_tokens (
      token       TEXT PRIMARY KEY,
      user_id     TEXT,
      platform    TEXT DEFAULT 'android',
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const notifSql = `
    CREATE TABLE IF NOT EXISTS app_notifications (
      id              TEXT PRIMARY KEY,
      type            TEXT NOT NULL DEFAULT 'INFO',
      title           TEXT NOT NULL,
      message         TEXT NOT NULL,
      target_user_id  TEXT,
      order_id        TEXT,
      is_admin_read   BOOLEAN NOT NULL DEFAULT FALSE,
      is_user_read    BOOLEAN NOT NULL DEFAULT FALSE,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  for (const [name, sql] of [['push_tokens', pushSql], ['app_notifications', notifSql]] as const) {
    try {
      const res = await fetch(`${SB}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: H,
        body: JSON.stringify({ sql }),
        cache: 'no-store',
      });
      results[name] = res.ok ? 'ok' : `${res.status}: ${await res.text()}`;
    } catch (err) {
      results[name] = String(err);
    }
  }

  return NextResponse.json({ results, note: 'If exec_sql fails, run the SQL manually in Supabase SQL editor.' });
}
