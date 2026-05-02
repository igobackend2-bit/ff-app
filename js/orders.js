// ============================================================
// orders.js — Order placement and real-time tracking
// ============================================================

import { supabase } from './supabase.js';
import { getSession } from './supabase.js';
import { formatPrice, formatDate, showToast } from './utils.js';

/**
 * Place a new order.
 * @param {Array} cartItems — from cart.js getCart()
 * @param {string} location — delivery address
 * @param {string} phone — delivery phone
 * @returns { success, orderId, error }
 */
export async function placeOrder(cartItems, location, phone) {
  const user = getSession();
  if (!user) return { success: false, error: 'Please login to place an order.' };
  if (!cartItems.length) return { success: false, error: 'Cart is empty.' };

  const totalPrice = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const productName = cartItems.map(i => `${i.name} x${i.quantity}`).join(', ');
  const category = cartItems[0].category || 'Mixed';

  // Insert main order
  const { data: order, error: orderErr } = await supabase.from('orders').insert({
    user_id:      user.id,
    product_name: productName,
    category,
    quantity:     cartItems.reduce((s, i) => s + i.quantity, 0),
    location:     location.trim(),
    phone:        phone.trim(),
    total_price:  totalPrice,
    status:       'placed',
    delivery_time: '24 hours',
  }).select().single();

  if (orderErr) return { success: false, error: 'Failed to place order. Please try again.' };

  // Insert order_items
  const orderItems = cartItems.map(i => ({
    order_id:     order.id,
    product_id:   i.id,
    product_name: i.name,
    quantity:     i.quantity,
    price:        i.price,
  }));
  await supabase.from('order_items').insert(orderItems);

  return { success: true, orderId: order.id };
}

/**
 * Fetch orders for the current user
 */
export async function fetchUserOrders() {
  const user = getSession();
  if (!user) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

/**
 * Subscribe to real-time order status updates for a user
 * @param {string} userId
 * @param {Function} onUpdate — called with updated order row
 * @returns unsubscribe function
 */
export function subscribeToOrders(userId, onUpdate) {
  const channel = supabase
    .channel('user-orders-' + userId)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `user_id=eq.${userId}`,
    }, (payload) => onUpdate(payload.new))
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/** Render an order card element */
export function renderOrderCard(order) {
  const statusConfig = {
    placed:            { label: 'Order Placed',       icon: '📋', cls: 'status-placed' },
    packing:           { label: 'Packing',             icon: '📦', cls: 'status-packing' },
    out_for_delivery:  { label: 'Out for Delivery',    icon: '🚚', cls: 'status-out_for_delivery' },
    delivered:         { label: 'Delivered',           icon: '✅', cls: 'status-delivered' },
  };
  const s = statusConfig[order.status] || statusConfig.placed;

  const card = document.createElement('div');
  card.className = 'order-card';
  card.dataset.orderId = order.id;
  card.innerHTML = `
    <div class="order-card-top">
      <div>
        <div class="order-id">#${order.id.slice(0, 8).toUpperCase()}</div>
        <div class="order-name">${order.product_name}</div>
        <div class="order-qty">Qty: ${order.quantity} item${order.quantity !== 1 ? 's' : ''} • ${order.location}</div>
      </div>
      <div class="order-date">${formatDate(order.created_at)}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
      <span class="status-badge ${s.cls}">${s.icon} ${s.label}</span>
      <span class="order-total">${formatPrice(order.total_price)}</span>
    </div>
    ${order.delivery_time ? `<div class="order-eta">🕐 Estimated delivery: ${order.delivery_time}</div>` : ''}
  `;
  return card;
}
