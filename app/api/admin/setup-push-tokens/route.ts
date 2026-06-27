// One-time setup: create push_tokens table in ERP Supabase via SQL
import { NextResponse } from 'next/server';

const SB      = 'https://qwiumswrbddwmlraktvy.supabase.co';
const SVC_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
const H = { apikey: SVC_KEY, Authorization: `Bearer ${SVC_KEY}`, 'Content-Type': 'application/json' };

const SQL = `
CREATE TABLE IF NOT EXISTS push_tokens (
  token       TEXT PRIMARY KEY,
  platform    TEXT NOT NULL DEFAULT 'android',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "anon_upsert" ON push_tokens FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "anon_read"   ON push_tokens FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "anon_update" ON push_tokens FOR UPDATE TO anon USING (true);
`;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(`${SB}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ sql: SQL }),
      cache: 'no-store',
    });
    // Try direct SQL via pg endpoint
    const res2 = await fetch(`${SB}/pg/query`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ query: SQL }),
      cache: 'no-store',
    });
    return NextResponse.json({ ok: true, status1: res.status, status2: res2.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
