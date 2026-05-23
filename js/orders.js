/**
 * orders.js — Farmers Factory
 * Order placement and tracking via Supabase.
 */

import { supabase } from './supabase.js';
import { getSession } from './auth.js';
import { getCart, clearCart } from './cart.js';

/**
 * Place a new order.
 * Inserts into orders + order_items tables.
 * @param {{location: string, phone: string}} delivery
 * @returns {Promise<{orderId?: string, error?: string}>}
 */
export async function placeOrder({ location, phone }) {
  const user = getSession();
  const cart = getCart();

  if (!cart.length) return { error: 'Your cart is empty.' };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal; // free delivery

  // Build a combined product name for the orders table summary column
  const productName  = cart.map(i => i.name).join(', ');
  const categoryName = cart[0]?.category || 'Mixed';

  // Insert into orders
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id:      user?.id || null,
      product_name: productName,
      category:     categoryName,
      quantity:     cart.reduce((s, i) => s + i.qty, 0),
      location,
      phone,
      total_price:  total,
      status:       'placed',
      delivery_time: null,
    })
    .select()
    .single();

  if (orderErr) {
    console.error('Order insert error:', orderErr);
    return { error: 'Could not place order. Please try again.' };
  }

  // Insert order_items
  const items = cart.map(i => ({
    order_id:     order.id,
    product_id:   i.id,
    product_name: i.name,
    quantity:     i.qty,
    price:        i.price,
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(items);
  if (itemsErr) console.warn('order_items insert partial error:', itemsErr);

  // Clear cart after successful order
  clearCart();

  return { orderId: order.id };
}

/**
 * Fetch all orders for the logged-in user.
 * @returns {Promise<Array>}
 */
export async function fetchMyOrders() {
  const user = getSession();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchMyOrders:', error); return []; }
  return data || [];
}

/**
 * Subscribe to realtime updates for a user's orders.
 * @param {string} userId
 * @param {Function} callback - called on any change
 * @returns Supabase realtime channel (call .unsubscribe() to stop)
 */
export function subscribeToOrders(userId, callback) {
  return supabase
    .channel('user-orders-' + userId)
    .on('postgres_changes', {
      event:  '*',
      schema: 'public',
      table:  'orders',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe();
}

/**
 * Build an order status badge HTML string.
 */
export function statusBadge(status) {
  const labels = {
    placed:            '📦 Placed',
    packing:           '🧺 Packing',
    out_for_delivery:  '🚚 Out for Delivery',
    delivered:         '✅ Delivered',
  };
  return `<span class="status-badge status-${status}">${labels[status] || status}</span>`;
}

/**
 * Format an ISO timestamp as a friendly date string.
 */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/**
 * Format an ISO timestamp with time.
 */
export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
