// ============================================================
// cart.js — Cart management with localStorage
// Cart stored as: localStorage['ff_cart'] = JSON array of items
// Each item: { id, name, unit, price, image_url, emoji, quantity }
// ============================================================

const CART_KEY = 'ff_cart';

/** Return all cart items */
export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

/** Save cart to localStorage */
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
}

/** Add item to cart (or increase qty if already exists) */
export function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      id:        product.id,
      name:      product.name,
      unit:      product.unit,
      price:     product.price,
      image_url: product.image_url || null,
      emoji:     getCategoryEmoji(product.category),
      quantity:  qty,
    });
  }
  saveCart(cart);
}

/** Update quantity of item. If qty <= 0, removes item. */
export function updateCartQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  } else {
    const item = cart.find(i => i.id === productId);
    if (item) item.quantity = qty;
  }
  saveCart(cart);
}

/** Remove item from cart */
export function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
}

/** Clear entire cart */
export function clearCart() {
  saveCart([]);
}

/** Total number of items (sum of quantities) */
export function getCartCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

/** Subtotal in rupees */
export function getCartSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

/** Get single item from cart by productId */
export function getCartItem(productId) {
  return getCart().find(i => i.id === productId) || null;
}

/** Returns emoji for a product category */
export function getCategoryEmoji(category) {
  const map = {
    vegetables: '🥬', veggies: '🥬', fruits: '🍎', dairy: '🥛',
    grains: '🌾', herbs: '🌿', default: '🥦',
  };
  if (!category) return map.default;
  return map[category.toLowerCase()] || map.default;
}

/** Format price as ₹XX */
export function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

/** Update all cart count badges on the page */
export function updateCartBadges() {
  const count = getCartCount();
  document.querySelectorAll('[data-cart-badge]').forEach(el => {
    el.textContent = count > 9 ? '9+' : String(count);
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/** Listen for cart updates and refresh badges */
export function initCartBadge() {
  updateCartBadges();
  window.addEventListener('cart-updated', updateCartBadges);
}
