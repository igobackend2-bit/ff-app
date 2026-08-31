// Shared Supabase REST helper that ALWAYS uses the service-role key.
// Many admin/config/order routes historically hard-coded the *anon* key
// (often misnamed "SERVICE_KEY"), so RLS silently blocked their writes:
// stock toggles, product deletes, order-status changes and min-order config
// all appeared to succeed but never persisted. Route everything through here.

export const SB_URL =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://qwiumswrbddwmlraktvy.supabase.co';

const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

export const SB_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || ANON;

export const sbAdminHeaders = (extra: Record<string, string> = {}) => ({
  apikey: SB_SERVICE_KEY,
  Authorization: `Bearer ${SB_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  ...extra,
});

interface SbOpts {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: string;          // e.g. "id=eq.123&select=*"
  body?: unknown;
  prefer?: string;         // e.g. "return=representation" | "resolution=merge-duplicates"
}

export async function sbAdmin<T = unknown>(table: string, opts: SbOpts = {}): Promise<{ ok: boolean; status: number; data: T; text: string }> {
  const { method = 'GET', query = '', body, prefer } = opts;
  const url = `${SB_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: sbAdminHeaders(prefer ? { Prefer: prefer } : {}),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let data: T;
  try { data = JSON.parse(text) as T; } catch { data = text as unknown as T; }
  return { ok: res.ok, status: res.status, data, text };
}
