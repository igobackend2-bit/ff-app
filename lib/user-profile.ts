// Persists the customer's display name against their phone number in ERP Supabase.
// Needed because Prisma is DB_DISABLED in production, so NextAuth's OTP login can't
// look up a previously-saved name and always fell back to "Farmer XXXX".
// Tries a dedicated customer_profiles table first; falls back to the notifications
// table (type=USER_PROFILE) so this works even before that table's SQL is run.
const SB  = 'https://qwiumswrbddwmlraktvy.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';
// Reads can use the public anon key; writes need the service-role key to get
// past row-level security (anon INSERT/UPSERT on these tables is denied, which
// is why saved names never persisted). Falls back to anon if the env is unset.
const SKEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || KEY;
const H   = { apikey: KEY,  Authorization: `Bearer ${KEY}`,  'Content-Type': 'application/json' };
const WH  = { apikey: SKEY, Authorization: `Bearer ${SKEY}`, 'Content-Type': 'application/json' };

export async function getProfileName(phone: string): Promise<string | null> {
  if (!phone) return null;

  try {
    const r = await fetch(
      `${SB}/rest/v1/customer_profiles?phone=eq.${encodeURIComponent(phone)}&select=name&limit=1`,
      { headers: WH, cache: 'no-store' },
    );
    if (r.ok) {
      const rows = await r.json() as Array<{ name: string }>;
      if (rows[0]?.name) return rows[0].name;
    }
  } catch { /* fall through */ }

  try {
    const r = await fetch(
      `${SB}/rest/v1/notifications?type=eq.USER_PROFILE&title=eq.${encodeURIComponent(phone)}&select=message&order=created_at.desc&limit=1`,
      { headers: WH, cache: 'no-store' },
    );
    if (r.ok) {
      const rows = await r.json() as Array<{ message: string }>;
      if (rows[0]?.message) return rows[0].message;
    }
  } catch { /* fall through */ }

  // Last resort: most recent order placed with this phone number
  try {
    const r = await fetch(
      `${SB}/rest/v1/orders?customer_phone=eq.${encodeURIComponent(phone)}&select=customer_name&order=created_at.desc&limit=1`,
      { headers: WH, cache: 'no-store' },
    );
    if (r.ok) {
      const rows = await r.json() as Array<{ customer_name: string }>;
      if (rows[0]?.customer_name) return rows[0].customer_name;
    }
  } catch { /* fall through */ }

  return null;
}

export async function saveProfileName(phone: string, name: string): Promise<void> {
  if (!phone || !name?.trim()) return;
  const trimmed = name.trim();

  let saved = false;
  try {
    const r = await fetch(`${SB}/rest/v1/customer_profiles`, {
      method: 'POST',
      headers: { ...WH, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ phone, name: trimmed, updated_at: new Date().toISOString() }),
      cache: 'no-store',
    });
    if (r.ok) saved = true;
    else console.warn('[user-profile] customer_profiles upsert failed:', r.status, (await r.text()).slice(0, 160));
  } catch (e) { console.warn('[user-profile] customer_profiles error:', String(e).slice(0, 120)); }

  if (!saved) {
    await fetch(
      `${SB}/rest/v1/notifications?type=eq.USER_PROFILE&title=eq.${encodeURIComponent(phone)}`,
      { method: 'DELETE', headers: WH, cache: 'no-store' },
    ).catch(() => {});

    const r = await fetch(`${SB}/rest/v1/notifications`, {
      method: 'POST',
      headers: { ...WH, Prefer: 'return=minimal' },
      body: JSON.stringify({
        type: 'USER_PROFILE', title: phone,
        message: trimmed, is_read: true, source: 'system',
      }),
      cache: 'no-store',
    }).catch((e) => { console.warn('[user-profile] notifications fallback error:', String(e).slice(0, 120)); return null; });
    if (r && !r.ok) console.warn('[user-profile] notifications fallback failed:', r.status, (await r.text()).slice(0, 160));
  }
}
