/**
 * profile.js — Farmers Factory
 * Profile page: display + edit user data, show order history.
 */

import { supabase } from './supabase.js';
import { getSession, clearSession, setSession } from './auth.js';
import { fetchMyOrders, statusBadge, formatDate } from './orders.js';
import { syncBadges } from './cart.js';

/** Initialise profile page. Call on DOMContentLoaded. */
export async function initProfile() {
  const user = getSession();
  if (!user) { window.location.href = '/login.html'; return; }

  syncBadges();

  // Render avatar
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('avatar').textContent = initials;

  // Fetch fresh data from Supabase
  const { data: fresh } = await supabase.from('users').select('*').eq('id', user.id).single();
  const profile = fresh || user;

  // Fill fields
  document.getElementById('name-val').textContent  = profile.name;
  document.getElementById('email-val').textContent = profile.email;
  const emailDisp = document.getElementById('email-display');
  if (emailDisp) emailDisp.value = profile.email;
  document.getElementById('phone-val').textContent = profile.phone;

  // Edit form inputs (hidden until edit clicked)
  document.getElementById('name-input').value  = profile.name;
  document.getElementById('phone-input').value = profile.phone;

  // Edit button toggle
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');
  const viewMode = document.getElementById('view-mode');
  const editMode = document.getElementById('edit-mode');

  editBtn.addEventListener('click', () => {
    viewMode.classList.add('hidden');
    editMode.classList.remove('hidden');
  });

  // Save profile
  saveBtn.addEventListener('click', async () => {
    const name  = document.getElementById('name-input').value.trim();
    const phone = document.getElementById('phone-input').value.trim();

    if (!name) { showToast('Name is required', 'error'); return; }
    if (!/^\d{10}$/.test(phone)) { showToast('Enter a valid 10-digit phone number', 'error'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const { error } = await supabase
      .from('users')
      .update({ name, phone })
      .eq('id', user.id);

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';

    if (error) { showToast('Update failed. Try again.', 'error'); return; }

    // Update session
    setSession({ ...user, name, phone });
    document.getElementById('name-val').textContent  = name;
    document.getElementById('phone-val').textContent = phone;
    const newInitials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('avatar').textContent = newInitials;

    viewMode.classList.remove('hidden');
    editMode.classList.add('hidden');
    showToast('Profile updated ✓', 'success');
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    window.location.href = '/login.html';
  });

  // Load orders
  await loadOrderHistory(user.id);
}

async function loadOrderHistory(userId) {
  const container = document.getElementById('orders-list');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';
  const orders = await fetchMyOrders();

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Start shopping to see your orders here</p>
      </div>`;
    return;
  }

  container.innerHTML = orders.map(o => `
    <div class="card" style="margin:0 0 10px">
      <div class="flex-between mb-8">
        <span style="font-size:12px;color:var(--text-3)">Order #${o.id.slice(0, 8).toUpperCase()}</span>
        ${statusBadge(o.status)}
      </div>
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${o.product_name}</div>
      <div style="font-size:12px;color:var(--text-3)">${formatDate(o.created_at)}</div>
      <div style="font-size:15px;font-weight:800;color:var(--primary);margin-top:6px">₹${o.total_price}</div>
      ${o.delivery_time ? `<div style="font-size:12px;color:var(--text-2);margin-top:4px">🚚 Delivery: ${o.delivery_time}</div>` : ''}
    </div>`).join('');
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
