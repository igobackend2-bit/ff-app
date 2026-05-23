/**
 * products.js — Farmers Factory
 * Fetch and render products from Supabase.
 */

import { supabase } from './supabase.js';
import { getSession } from './auth.js';
import { getWishlist, toggleWishlist } from './cart.js';

// Category emoji fallbacks
const CATEGORY_EMOJI = {
  vegetables: '🥦', veggies: '🥦',
  fruits: '🍎',
  dairy: '🥛',
  grains: '🌾',
  herbs: '🌿',
  default: '🌱',
};

/** Return a fallback emoji for a product based on its category. */
export function getCategoryEmoji(category = '') {
  return CATEGORY_EMOJI[category.toLowerCase()] || CATEGORY_EMOJI.default;
}

/** Calculate discount percentage. */
export function discountPct(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

/** Format price as ₹XX.XX */
export function formatPrice(n) {
  return '₹' + Number(n).toFixed(0);
}

/**
 * Fetch all products from Supabase, optionally filtered by category.
 * @param {string|null} category - null = all
 * @returns {Promise<Array>}
 */
export async function fetchProducts(category = null) {
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (category && category !== 'all') {
    query = query.ilike('category', category);
  }
  const { data, error } = await query;
  if (error) { console.error('fetchProducts error:', error); return []; }
  return data || [];
}

/**
 * Fetch a single product by ID.
 * @returns {Promise<object|null>}
 */
export async function fetchProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

/**
 * Fetch products in the same category (for related section).
 * @returns {Promise<Array>}
 */
export async function fetchRelated(category, excludeId) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .ilike('category', category)
    .neq('id', excludeId)
    .limit(8);
  return data || [];
}

/**
 * Search products by name or category.
 * @returns {Promise<Array>}
 */
export async function searchProducts(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const { data } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${q}%,category.ilike.%${q}%`)
    .limit(10);
  return data || [];
}

/**
 * Build product card HTML string.
 * @param {object} product
 * @returns {string} HTML
 */
export function buildProductCard(product) {
  const wishlist   = getWishlist();
  const isWished   = wishlist.some(w => w.id === product.id);
  const discount   = discountPct(product.price, product.old_price);
  const emoji      = getCategoryEmoji(product.category);
  const imgHtml    = product.image_url
    ? `<img src="${product.image_url}" alt="${product.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const emojiDiv   = `<div class="product-emoji-fallback" style="${product.image_url ? 'display:none' : ''}">${emoji}</div>`;

  return `
  <div class="product-card" data-id="${product.id}">
    <div class="product-card-img-wrap">
      ${imgHtml}
      ${emojiDiv}
      ${product.is_organic ? '<span class="organic-tag">Organic</span>' : ''}
      ${discount > 0 ? `<span class="discount-tag">${discount}% off</span>` : ''}
      <button class="wishlist-btn ${isWished ? 'active' : ''}" data-id="${product.id}" aria-label="Toggle wishlist">
        ${isWished ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="product-card-body">
      <div class="product-name">${product.name}</div>
      <div class="product-unit">${product.unit || ''}</div>
      <div class="product-price-row">
        <div>
          <span class="product-price">${formatPrice(product.price)}</span>
          ${product.old_price ? `<span class="product-old-price">${formatPrice(product.old_price)}</span>` : ''}
        </div>
        <button class="add-btn" data-id="${product.id}" aria-label="Add to cart">+</button>
      </div>
    </div>
  </div>`;
}

/**
 * Render products into a grid container and wire up events.
 * @param {HTMLElement} container
 * @param {Array} products
 * @param {Function} onAddToCart - callback(product)
 */
export function renderProductGrid(container, products, onAddToCart) {
  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:span 2">
        <div class="empty-icon">🌿</div>
        <h3>No products found</h3>
        <p>Try a different category or search term</p>
      </div>`;
    return;
  }

  container.innerHTML = products.map(buildProductCard).join('');

  // Navigate to product detail on card click (not on action buttons)
  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.wishlist-btn') || e.target.closest('.add-btn')) return;
      window.location.href = `product-detail.html?id=${card.dataset.id}`;
    });
  });

  // Wishlist toggle
  container.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id      = btn.dataset.id;
      const product = products.find(p => p.id === id);
      if (!product) return;
      const isNowWished = toggleWishlist(product);
      btn.classList.toggle('active', isNowWished);
      btn.textContent = isNowWished ? '❤️' : '🤍';
      showToast(isNowWished ? 'Added to wishlist ❤️' : 'Removed from wishlist', 'info');
    });
  });

  // Add to cart
  container.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id      = btn.dataset.id;
      const product = products.find(p => p.id === id);
      if (product && onAddToCart) onAddToCart(product);
    });
  });
}

/** Simple toast helper (used in this module). */
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
