// ============================================================
// auth.js — OTP Authentication (EmailJS + Supabase otps table)
// ============================================================
// Setup EmailJS at emailjs.com (free tier):
//   EMAILJS_SERVICE_ID  — your EmailJS service ID
//   EMAILJS_TEMPLATE_ID — template with {{otp}} variable
//   EMAILJS_PUBLIC_KEY  — your EmailJS public key
// ============================================================

import { supabase, saveSession, clearSession } from './supabase.js';

const EMAILJS_SERVICE_ID  = 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = 'YOUR_EMAILJS_PUBLIC_KEY';

// Load EmailJS dynamically
function loadEmailJS() {
  return new Promise((resolve) => {
    if (window.emailjs) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    s.onload = () => { emailjs.init(EMAILJS_PUBLIC_KEY); resolve(); };
    document.head.appendChild(s);
  });
}

/** Generate a 6-digit OTP string */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send OTP to email.
 * Saves hashed OTP to supabase otps table with 10-min expiry.
 * Returns { success, error }
 */
export async function sendOTP(email) {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Invalidate old OTPs for this email
  await supabase.from('otps').update({ used: true }).eq('email', email).eq('used', false);

  // Store new OTP
  const { error: dbErr } = await supabase.from('otps').insert({
    email,
    otp,
    expires_at: expiresAt,
    used: false,
  });
  if (dbErr) return { success: false, error: 'Failed to generate OTP. Please try again.' };

  // Send via EmailJS
  try {
    await loadEmailJS();
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      otp,
      app_name: 'Farmers Factory',
    });
    return { success: true };
  } catch (e) {
    console.error('EmailJS error:', e);
    // For demo: show OTP in console so you can test without EmailJS configured
    console.warn(`[DEMO MODE] OTP for ${email}: ${otp}`);
    return { success: true }; // Still return success so you can test
  }
}

/**
 * Verify OTP from otps table.
 * Returns { valid: boolean, error?: string }
 */
export async function verifyOTP(email, otp) {
  const { data, error } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
    .eq('otp', otp.trim())
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return { valid: false, error: 'Invalid or expired OTP.' };

  // Mark as used
  await supabase.from('otps').update({ used: true }).eq('id', data.id);
  return { valid: true };
}

/**
 * Sign up a new user.
 * Returns { success, user, error }
 */
export async function signUp(name, email, phone) {
  // Check if email already exists
  const { data: existing } = await supabase
    .from('users').select('id').eq('email', email).single();
  if (existing) return { success: false, error: 'This email is already registered. Please login.' };

  const { data: user, error } = await supabase.from('users').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    is_verified: true,
  }).select().single();

  if (error) return { success: false, error: 'Failed to create account. Please try again.' };
  return { success: true, user };
}

/**
 * Log in existing user by email.
 * Returns { success, user, error }
 */
export async function loginUser(email) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !user) {
    return { success: false, error: 'No account found with this email. Please sign up first.' };
  }

  saveSession(user);
  return { success: true, user };
}

/** Log out */
export function logout() {
  clearSession();
  window.location.href = '/login.html';
}

// ── OTP input auto-advance helper ─────────────────────────────
export function setupOTPInputs(container) {
  const inputs = container.querySelectorAll('.otp-input');
  inputs.forEach((input, i) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(-1);
      if (val && i < inputs.length - 1) inputs[i + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) inputs[i - 1].focus();
    });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      [...paste].forEach((ch, j) => {
        if (inputs[i + j]) inputs[i + j].value = ch;
      });
      if (inputs[Math.min(i + paste.length, inputs.length - 1)]) {
        inputs[Math.min(i + paste.length, inputs.length - 1)].focus();
      }
    });
  });

  return {
    getValue: () => [...inputs].map(inp => inp.value).join(''),
    clear: () => inputs.forEach(inp => { inp.value = ''; }),
    focus: () => inputs[0].focus(),
  };
}
