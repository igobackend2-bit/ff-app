/**
 * cart.js — Farmers Factory
 * localStorage cart + wishlist logic.
 */

const CART_KEY     = 'ff_cart';
const WISHLIST_KEY = 'ff_wishlist';

// ── Cart ───────────────────────────────────────────────────

/** @returns {Array} */
export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

/**
 * Add product to cart or increment quantity.
 * @param {object} product - full product object from Supabase
 * @param {number} qty
 */
export function addToCart(product, qty = 1) {
  const cart  = getCart();
  const index = cart.findIndex(i => i.id === product.id);
  if (index >= 0) {
    cart[index].qty += qty;
  } else {
    cart.push({ ...product, qty });
  }
  saveCart(cart);
  showToast(`${product.name} added to cart 🛒`, 'success');
  updateCartBadge();
}

/**
 * Update quantity of a cart item.
 * @param {string} productId
 * @param {number} qty - if <= 0, removes the item
 */
export function updateCartQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  } else {
    const item = cart.find(i => i.id === productId);
    if (item) item.qty = qty;
  }
  saveCart(cart);
}

/** Remove item from cart by product id. */
export function removeFromCart(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

/** Clear the entire cart. */
export function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

/** Total number of items in cart. */
export function cartCount() {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

/** Cart subtotal. */
export function cartSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}

// ── Wishlist ───────────────────────────────────────────────

/** @returns {Array} */
export function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
  catch { return []; }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  updateWishlistBadge();
}

/**
 * Toggle product in wishlist.
 * @returns {boolean} true if now wishlisted
 */
export function toggleWishlist(product) {
  const list  = getWishlist();
  const index = list.findIndex(i => i.id === product.id);
  if (index >= 0) {
    list.splice(index, 1);
    saveWishlist(list);
    return false;
  } else {
    list.push(product);
    saveWishlist(list);
    return true;
  }
}

/** Check if a product is in the wishlist. */
export function isWishlisted(productId) {
  return getWishlist().some(i => i.id === productId);
}

// ── Badge updaters ─────────────────────────────────────────

export function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

export function updateWishlistBadge() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/** Call on page load to sync all badges. */
export function syncBadges() {
  updateCartBadge();
  updateWishlistBadge();
}

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
