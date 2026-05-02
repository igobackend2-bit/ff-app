// ============================================================
// products.js — Product fetching and rendering from Supabase
// ============================================================

import { supabase } from './supabase.js';
import { addToCart, getCartItem, updateCartQty, getCategoryEmoji, formatPrice, initCartBadge } from './cart.js';
import { showToast } from './utils.js';

/** Category emoji mapping */
export { getCategoryEmoji };

/**
 * Fetch all products (optionally filter by category)
 * Returns array of product objects
 */
export async function fetchProducts(category = null, search = null) {
  let query = supabase.from('products').select('*').gt('stock', 0).order('created_at', { ascending: false });
  if (category && category !== 'all') {
    query = query.ilike('category', category);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) { console.error('fetchProducts error:', error); return []; }
  return data || [];
}

/**
 * Fetch single product by ID
 */
export async function fetchProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

/**
 * Fetch related products (same category, exclude current)
 */
export async function fetchRelated(category, excludeId) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .ilike('category', category)
    .neq('id', excludeId)
    .gt('stock', 0)
    .limit(8);
  return data || [];
}

/**
 * Get wishlist from localStorage
 */
export function getWishlist() {
  try { return JSON.parse(localStorage.getItem('ff_wishlist')) || []; }
  catch { return []; }
}

export function toggleWishlist(productId, productName) {
  let wl = getWishlist();
  const idx = wl.indexOf(productId);
  if (idx > -1) {
    wl.splice(idx, 1);
    showToast(`Removed from wishlist`, 'info');
  } else {
    wl.push(productId);
    showToast(`❤️ Added to wishlist`, 'success');
  }
  localStorage.setItem('ff_wishlist', JSON.stringify(wl));
  window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { wishlist: wl } }));
  return wl.includes(productId);
}

export function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

/** Update wishlist badge counts */
export function updateWishlistBadges() {
  const count = getWishlist().length;
  document.querySelectorAll('[data-wish-badge]').forEach(el => {
    el.textContent = count > 9 ? '9+' : String(count);
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/**
 * Render a product card element
 * @param {Object} product
 * @param {boolean} inWishlist
 * @returns {HTMLElement}
 */
export function renderProductCard(product) {
  const wl = isWishlisted(product.id);
  const cartItem = getCartItem(product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const hasDiscount = product.old_price && product.old_price > product.price;
  const discPct = hasDiscount ? Math.round((1 - product.price / product.old_price) * 100) : 0;
  const emoji = getCategoryEmoji(product.category);

  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = product.id;
  card.innerHTML = `
    <div class="card-img-wrap">
      ${product.image_url
        ? `<img src="${product.image_url}" alt="${product.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <span style="display:${product.image_url ? 'none' : 'flex'}; align-items:center; justify-content:center; width:100%; height:100%; font-size:52px;">${emoji}</span>
      ${product.is_organic ? '<span class="organic-badge">🌱 Organic</span>' : ''}
      ${hasDiscount ? `<span class="discount-badge">${discPct}% OFF</span>` : ''}
      <button class="wish-btn ${wl ? 'active' : ''}" aria-label="Toggle wishlist" data-wish-id="${product.id}">
        ${wl ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="card-body">
      <div class="card-name">${product.name}</div>
      <div class="card-unit">${product.unit}</div>
      <div class="card-price-row">
        <div>
          <span class="card-price">${formatPrice(product.price)}</span>
          ${hasDiscount ? `<span class="card-old-price">${formatPrice(product.old_price)}</span>` : ''}
        </div>
        <div class="card-qty-wrap">
          ${cartQty > 0
            ? `<div class="qty-control">
                <button class="qty-btn" data-action="dec" data-id="${product.id}">−</button>
                <span class="qty-num">${cartQty}</span>
                <button class="qty-btn" data-action="inc" data-id="${product.id}">+</button>
              </div>`
            : `<button class="add-btn" data-action="add" data-id="${product.id}" aria-label="Add to cart">+</button>`
          }
        </div>
      </div>
    </div>
  `;

  // Click card → detail page
  card.addEventListener('click', (e) => {
    if (e.target.closest('.wish-btn, .add-btn, .qty-btn')) return;
    window.location.href = `/product-detail.html?id=${product.id}`;
  });

  // Wishlist toggle
  card.querySelector('.wish-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const wishlisted = toggleWishlist(product.id, product.name);
    btn.textContent = wishlisted ? '❤️' : '🤍';
    btn.classList.toggle('active', wishlisted);
    updateWishlistBadges();
  });

  // Add / qty controls
  card.addEventListener('click', (e) => {
    const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
    const id = e.target.dataset.id || e.target.closest('[data-id]')?.dataset.id;
    if (!action || !id) return;

    if (action === 'add') {
      addToCart(product, 1);
      showToast(`🛒 ${product.name} added to cart`, 'success');
      refreshCardQty(card, product, 1);
    } else if (action === 'inc') {
      const newQty = (getCartItem(id)?.quantity || 0) + 1;
      updateCartQty(id, newQty);
      refreshCardQty(card, product, newQty);
    } else if (action === 'dec') {
      const newQty = (getCartItem(id)?.quantity || 0) - 1;
      updateCartQty(id, newQty);
      refreshCardQty(card, product, newQty);
    }
  });

  return card;
}

function refreshCardQty(card, product, qty) {
  const wrap = card.querySelector('.card-qty-wrap');
  if (!wrap) return;
  if (qty <= 0) {
    wrap.innerHTML = `<button class="add-btn" data-action="add" data-id="${product.id}" aria-label="Add to cart">+</button>`;
  } else {
    wrap.innerHTML = `<div class="qty-control">
      <button class="qty-btn" data-action="dec" data-id="${product.id}">−</button>
      <span class="qty-num">${qty}</span>
      <button class="qty-btn" data-action="inc" data-id="${product.id}">+</button>
    </div>`;
  }
}

/**
 * Render products into a grid container
 */
export async function renderProductGrid(container, category = null, search = null) {
  container.innerHTML = `<div class="loader" style="grid-column:1/-1"><div class="spinner"></div><span class="loader-text">Loading fresh products…</span></div>`;
  const products = await fetchProducts(category, search);
  container.innerHTML = '';
  if (!products.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🌱</div><h3>No products found</h3><p>Try a different category or search term.</p></div>`;
    return;
  }
  products.forEach(p => container.appendChild(renderProductCard(p)));
  initCartBadge();
  updateWishlistBadges();
}
