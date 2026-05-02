// ============================================================
// supabase.js — Supabase client initialisation
// Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with
// your actual project values from supabase.com → Settings → API
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Session helpers ──────────────────────────────────────────
/** Returns parsed ff_user object from localStorage, or null */
export function getSession() {
  try { return JSON.parse(localStorage.getItem('ff_user')); }
  catch { return null; }
}

/** Saves user session to localStorage */
export function saveSession(user) {
  localStorage.setItem('ff_user', JSON.stringify(user));
}

/** Clears user session */
export function clearSession() {
  localStorage.removeItem('ff_user');
}

/** Redirects to login if no session */
export function requireAuth(redirectTo = '/login.html') {
  if (!getSession()) {
    window.location.href = redirectTo;
  }
}

/** Returns true if admin session is active */
export function isAdmin() {
  return localStorage.getItem('ff_admin') === 'true';
}
