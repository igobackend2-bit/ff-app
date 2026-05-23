/**
 * auth.js — Farmers Factory (CDN build)
 * Requires: supabase CDN + supabase.js loaded first
 * All functions exposed on window.*
 */

/* ── Toast ────────────────────────────────────────────── */
window.showToast = function(msg, type) {
  type = type || 'success';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(function() {
    t.classList.add('out');
    setTimeout(function() { t.remove(); }, 300);
  }, 2800);
};

/* ── Session ──────────────────────────────────────────── */
window.getSession = function() {
  try { return JSON.parse(localStorage.getItem('ff_user')); } catch(e) { return null; }
};

window.saveSession = function(user) {
  localStorage.setItem('ff_user', JSON.stringify({
    id:      user.id      || '',
    name:    user.name    || '',
    phone:   user.phone   || '',
    email:   user.email   || '',
    address: user.address || ''
  }));
};

window.logout = function() {
  localStorage.removeItem('ff_user');
  window.location.href = 'index.html';
};

window.requireUser = function() {
  var user = window.getSession();
  if (!user) {
    var depth = window.location.pathname.split('/').filter(Boolean).length;
    window.location.href = depth > 1 ? '../login.html' : 'login.html';
    return null;
  }
  return user;
};

window.requireAdmin = function() {
  if (localStorage.getItem('ff_admin') !== 'true') {
    window.location.href = 'index.html';
    return false;
  }
  return true;
};

/* ── EmailJS OTP ──────────────────────────────────────── */
var EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
var EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
var EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

window.generateOTP = function() {
  return String(Math.floor(100000 + Math.random() * 900000));
};

window.saveOTP = async function(email, otp) {
  try {
    var expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    var res = await window.db.from('otps').insert([{
      email:      email.toLowerCase().trim(),
      otp:        otp,
      expires_at: expiresAt,
      used:       false
    }]);
    if (res.error) return { success: false, error: res.error.message };
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
};

window.sendOTP = async function(email, otp, name) {
  try {
    if (typeof emailjs === 'undefined') return { success: false, error: 'EmailJS not loaded' };
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      otp:      otp,
      name:     name || 'Customer'
    }, EMAILJS_PUBLIC_KEY);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
};

window.verifyOTP = async function(email, enteredOTP) {
  try {
    var now = new Date().toISOString();
    var res = await window.db.from('otps')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('otp', String(enteredOTP).trim())
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (res.error || !res.data) {
      return { valid: false, reason: 'Invalid or expired OTP' };
    }
    return { valid: true, record: res.data };
  } catch(e) {
    return { valid: false, reason: 'Verification error' };
  }
};

window.markOTPUsed = async function(otpId) {
  try {
    await window.db.from('otps').update({ used: true }).eq('id', otpId);
  } catch(e) { /* non-blocking */ }
};
