/**
 * admin.js — Farmers Factory Admin Panel
 * All admin-side logic: auth guard, dashboard stats,
 * products CRUD, orders management, customers table.
 */

import { supabase } from './supabase.js';

// ── Admin Session ──────────────────────────────────────────
export function setAdminSession() {
  localStorage.setItem('ff_admin', 'true');
}

export function isAdminLoggedIn() {
  return localStorage.getItem('ff_admin') === 'true';
}

export function logoutAdmin() {
  localStorage.removeItem('ff_admin');
  window.location.href = 'index.html';
}

export function requireAdmin() {
  if (!isAdminLoggedIn()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ── Toast ──────────────────────────────────────────────────
export function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ── Dashboard Stats ────────────────────────────────────────
export async function loadDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);

  const [products, orders, users, revenueToday, pendingOrders, deliveredToday] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_price').gte('created_at', today),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'placed'),
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .eq('status', 'delivered').gte('created_at', today),
  ]);

  const revenue = (revenueToday.data || []).reduce((s, o) => s + Number(o.total_price), 0);

  return {
    totalProducts:   products.count  || 0,
    totalOrders:     orders.count    || 0,
    totalCustomers:  users.count     || 0,
    revenueToday:    revenue,
    pendingOrders:   pendingOrders.count  || 0,
    deliveredToday:  deliveredToday.count || 0,
  };
}

// ── Products ───────────────────────────────────────────────
export async function fetchAllProducts() {
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function saveProduct(product, id = null) {
  if (id) {
    return supabase.from('products').update(product).eq('id', id).select().single();
  }
  return supabase.from('products').insert(product).select().single();
}

export async function deleteProduct(id) {
  return supabase.from('products').delete().eq('id', id);
}

/**
 * Upload an image file to Supabase Storage 'product-images' bucket.
 * Returns public URL or null on error.
 */
export async function uploadProductImage(file) {
  const ext  = file.name.split('.').pop();
  const path = `${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) { console.error('Image upload error:', error); return null; }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data?.publicUrl || null;
}

// ── Orders ─────────────────────────────────────────────────
export async function fetchAllOrders(statusFilter = null) {
  let query = supabase
    .from('orders')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data } = await query;
  return data || [];
}

export async function updateOrderStatus(orderId, status) {
  return supabase.from('orders').update({ status }).eq('id', orderId);
}

export async function updateDeliveryTime(orderId, deliveryTime) {
  return supabase.from('orders').update({ delivery_time: deliveryTime }).eq('id', orderId);
}

// ── Customers ──────────────────────────────────────────────
export async function fetchAllCustomers() {
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (!users?.length) return [];

  // Count orders per user
  const { data: orderCounts } = await supabase
    .from('orders')
    .select('user_id');

  const countMap = {};
  (orderCounts || []).forEach(o => {
    countMap[o.user_id] = (countMap[o.user_id] || 0) + 1;
  });

  return users.map(u => ({ ...u, orderCount: countMap[u.id] || 0 }));
}

// ── Realtime ───────────────────────────────────────────────
export function subscribeToProducts(callback) {
  return supabase
    .channel('admin-products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
    .subscribe();
}

export function subscribeToOrders(callback) {
  return supabase
    .channel('admin-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
    .subscribe();
}

// ── Recent data ────────────────────────────────────────────
export async function fetchRecentOrders(limit = 10) {
  const { data } = await supabase
    .from('orders')
    .select('*, users(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function fetchRecentCustomers(limit = 5) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ── Helpers ────────────────────────────────────────────────
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function statusBadge(status) {
  const labels = {
    placed:           '📦 Placed',
    packing:          '🧺 Packing',
    out_for_delivery: '🚚 Out for Delivery',
    delivered:        '✅ Delivered',
  };
  return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}
