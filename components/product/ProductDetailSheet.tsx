'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingCart, Plus, Minus, Truck, AlertTriangle } from 'lucide-react';
import { useProductDetailStore } from '@/store/productDetailStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn, formatPrice, discountPercent } from '@/lib/utils';
import { ProductGallery } from '@/components/product/ProductGallery';
import { useUIStore } from '@/store/uiStore';

/* ── helpers ── */
function extractNumericUnit(unit: string): number {
  const m = unit.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1] ?? '1') : 1;
}

/**
 * Returns quick-pick quantity multipliers based on category slug.
 * Each value represents how many product units (packs/kg/etc.) to add.
 *
 * Examples:
 *   Vegetables (unit="1 kg")  → [1,2,3,…,25] → displays "1kg","2kg"…"25kg"
 *   Oils (unit="500 ml")      → [1,2,5,10,15,20] → "500ml","1000ml"…"10000ml"
 *   Millets (unit="500 gm")   → [1,2] → "500gm","1000gm"
 *   Ghee/Honey (unit="250gm") → [1,2] → "250gm","500gm"
 *   Spices/Nuts (unit="100gm")→ [1,2,3,4,5] → "100gm"…"500gm"
 */
function getCategoryPresets(categorySlug: string, unit?: string, productName?: string): number[] {
  const slug = categorySlug.toLowerCase();
  const u = (unit ?? '').toLowerCase();
  const name = (productName ?? '').toLowerCase();
  const currentUnit = extractNumericUnit(unit ?? '1');

  if (/oil/.test(name)) {
    return currentUnit >= 1000 || /\b1\s*l\b|\b1\s*ltr\b|\b1\s*litre\b/.test(u) ? [1] : [1, 2];
  }

  if (/ghee|honey/.test(name)) {
    return currentUnit >= 500 ? [1] : [1, 2];
  }

  if (/palm\s*jaggery|karupatti/.test(name)) {
    return currentUnit >= 1000 || /\b1\s*kg\b/.test(u) ? [1] : [1, 2];
  }

  // Fruits & Vegetables → 1kg to 25kg
  if (/fruit|vegetable|veggie|veg\b|greens|fresh-produce/.test(slug)) {
    return [1, 2, 3, 4, 5, 10, 15, 20, 25];
  }

  // Oils → 500ml, 1000ml ONLY
  if (/oil/.test(slug) || /\bml\b/.test(u)) {
    return currentUnit >= 1000 || /\b1\s*l\b|\b1\s*ltr\b|\b1\s*litre\b/.test(u) ? [1] : [1, 2];
  }

  // Millets & Grains → 500gm, 1000gm
  if (/millet|grain/.test(slug)) {
    return [1, 2];
  }

  // Dairy / Ghee → 250gm, 500gm
  if (/ghee|dairy/.test(slug)) {
    return [1, 2];
  }

  // Honey → 250gm, 500gm
  if (/honey/.test(slug) || /honey/i.test(unit ?? '')) {
    return [1, 2];
  }

  // Jaggery / Palm Jaggery / Sweeteners → 500gm, 1kg
  if (/jaggery|sweetener|sugar|palm/.test(slug)) {
    return [1, 2];
  }

  // Spices & Masalas → 100gm to 500gm
  if (/spice|masala|pepper|chilli|turmeric|coriander/.test(slug)) {
    return [1, 2, 3, 4, 5];
  }

  // Nuts & Dry Fruits → 100gm to 500gm
  if (/nut|dry.?fruit|almond|cashew|walnut|raisin|pistachio/.test(slug)) {
    return [1, 2, 3, 4, 5];
  }

  // Unit-based fallback for slugs that don't match category patterns
  // (e.g., "valluvam-honey" → unit="250 gm" → 250gm, 500gm)
  if (/250\s*g/i.test(u)) return [1, 2];   // 250gm base → 250gm, 500gm
  if (/500\s*g/i.test(u)) return [1, 2];   // 500gm base → 500gm, 1000gm
  if (/100\s*g/i.test(u)) return [1, 2, 3, 4, 5]; // 100gm base → spice-style

  // Default
  return [1, 2, 5, 10, 15, 20];
}

export function ProductDetailSheet() {
  const { isOpen, product, closeSheet } = useProductDetailStore();
  const addItem        = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems      = useCartStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist   = useWishlistStore((s) => product ? s.isWishlisted(product.id) : false);
  const addToast       = useUIStore((s) => s.addToast);

  // Weight / quantity selector state
  const [selectedQty, setSelectedQty] = useState(1);
  // Available inventory for this product (null = unknown / unlimited)
  const [stockQty, setStockQty] = useState<number | null>(null);

  const cartItem = product ? cartItems.find((item) => item.productId === product.id) : null;
  const quantity = cartItem?.quantity ?? 0;

  // Reset qty and fetch stock when product changes
  useEffect(() => {
    setSelectedQty(1);
    setStockQty(null);
    if (!product?.id) return;
    fetch(`/api/products/stock?productId=${product.id}`)
      .then((r) => r.json())
      .then((d: { qty: number | null }) => setStockQty(d.qty ?? null))
      .catch(() => setStockQty(null));
  }, [product?.id]);

  // ── Similar products ─────────────────────────────────────────────
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const openSheet = useProductDetailStore((s) => s.openSheet);

  useEffect(() => {
    setSimilarProducts([]);
    if (!product?.categorySlug) return;
    const controller = new AbortController();
    fetch(
      `/api/products?category=${encodeURIComponent(product.categorySlug)}&limit=8`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((json: any) => {
        const items: any[] =
          Array.isArray(json?.data?.data) ? json.data.data :
          Array.isArray(json?.data)       ? json.data       : [];
        setSimilarProducts(items.filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch(() => {/* ignore abort */});
    return () => controller.abort();
  }, [product?.id, product?.categorySlug]);

  const handleToggleWishlist = useCallback(() => {
    if (!product) return;
    toggleWishlist(product);
    addToast({
      title: isInWishlist ? 'Removed from wishlist' : 'Added to wishlist ❤️',
      variant: isInWishlist ? 'default' : 'success',
    });
  }, [product, toggleWishlist, isInWishlist, addToast]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem(product, selectedQty);
    addToast({ title: `🛒 ${product.name} ×${selectedQty} added to cart!`, variant: 'success' });
  }, [product, addItem, addToast, selectedQty]);

  const discount = product ? discountPercent(product.mrp, product.price) : 0;
  const images   = product?.imageUrls ?? [];

  // Weight selector derived values
  const unitNum      = product ? extractNumericUnit(product.unit) : 1;
  const isWeightUnit = product ? /kg|g\b|gm|gram|litre|ltr|ml|l\b/i.test(product.unit) : false;
  // Cap slider max at available inventory if known
  const maxQty       = stockQty !== null ? Math.max(1, stockQty) : 30;
  const stockLow     = stockQty !== null && stockQty <= 10 && stockQty > 0;
  const stockExceeded = stockQty !== null && selectedQty > stockQty;

  const totalWeight = selectedQty * unitNum;
  const unitLabel   = product?.unit ?? '';
  const totalPrice  = product ? product.price * selectedQty : 0;
  const totalMrp    = product ? product.mrp   * selectedQty : 0;

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            key="detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeSheet}
            className="fixed inset-0 z-[8000] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet — slides up from bottom */}
          <motion.div
            key="detail-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[8001]',
              'max-h-[92vh] overflow-y-auto rounded-t-[28px] bg-white pb-32 shadow-2xl',
            )}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-12 rounded-full bg-neutral-200" />
            </div>

            {/* Top action buttons */}
            <div className="absolute right-4 top-4 z-10 flex gap-2">
              <button
                onClick={handleToggleWishlist}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md backdrop-blur-md transition-all active:scale-90',
                  isInWishlist ? 'text-red-500' : 'text-neutral-300',
                )}
              >
                <Heart className={cn('h-5 w-5', isInWishlist && 'fill-current')} />
              </button>
              <button
                onClick={closeSheet}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Amazon-style Gallery ── */}
            <div className="px-4 pt-2 pb-1">
              <ProductGallery
                imageUrls={images}
                blurDataUrls={product.blurDataUrls}
                productName={product.name}
                productUnit={product.unit}
                discount={discount}
              />
            </div>

            {/* ── Product Info ── */}
            <div className="px-5 pt-5">
              {/* Category + Stock */}
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                  {product.categoryName || product.categorySlug}
                </span>
                {product.inStock ? (
                  <span className="rounded-md border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
                    IN STOCK
                  </span>
                ) : (
                  <span className="rounded-md border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    OUT OF STOCK
                  </span>
                )}
              </div>

              {/* Name + unit */}
              <h2 className="text-2xl font-black leading-tight text-neutral-900">{product.name}</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">{product.unit}</p>

              {/* Price row */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-neutral-900">{formatPrice(product.price)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-neutral-400 line-through">{formatPrice(product.mrp)}</span>
                    <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-sm font-bold text-white">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Feature chips */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Delivery</p>
                    <p className="text-xs font-bold text-neutral-800">Within 24 Hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 text-lg">
                    🌾
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Source</p>
                    <p className="text-xs font-bold text-neutral-800">Direct Farm</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-neutral-900">Product Details</h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {product.description || `Fresh ${product.name} sourced directly from verified partner farms. Harvested at peak ripeness for maximum nutrition and flavour.`}
                </p>
              </div>

              {/* ── Weight / Quantity Selector ── */}
              <div className={cn(
                'mt-6 rounded-2xl border p-4',
                stockExceeded ? 'border-red-200 bg-red-50' : 'border-neutral-100 bg-neutral-50',
              )}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-800">
                    {isWeightUnit ? 'Select Weight' : 'Select Quantity'}
                  </span>
                  <span className={cn(
                    'rounded-xl px-3 py-1 text-sm font-black text-white',
                    stockExceeded ? 'bg-red-500' : 'bg-primary-600',
                  )}>
                    {isWeightUnit
                      ? `${totalWeight % 1 === 0 ? totalWeight : totalWeight.toFixed(1)} ${unitLabel.replace(/\d+(?:\.\d+)?\s*/g, '').trim() || 'kg'}`
                      : `${selectedQty} × ${unitLabel}`}
                  </span>
                </div>

                {/* Stock exceeded warning */}
                {stockExceeded && stockQty !== null && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-100 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-700">
                      Only <span className="font-black">{stockQty} {isWeightUnit ? unitLabel : 'units'}</span> available.
                      Please reduce your quantity.
                    </p>
                  </div>
                )}

                {/* Low stock warning */}
                {stockLow && !stockExceeded && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs font-bold text-amber-700">
                      Only <span className="font-black">{stockQty} {isWeightUnit ? unitLabel : 'units'}</span> left in stock!
                    </p>
                  </div>
                )}

                {/* Quick pick cards */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {getCategoryPresets(product.categorySlug ?? '', product.unit, product.name).filter((q) => q <= maxQty).map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQty(q)}
                      className={cn(
                        'rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all',
                        selectedQty === q
                          ? 'border-primary-500 bg-primary-600 text-white shadow-md'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-primary-300 hover:bg-primary-50',
                      )}
                    >
                      {isWeightUnit
                        ? `${q * unitNum}${unitLabel.replace(/[\d.]+\s*/,'').trim() || 'kg'}`
                        : `×${q}`}
                    </button>
                  ))}
                </div>

                {/* Manual quantity input */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-500">Custom:</span>
                  <div className="flex items-center rounded-xl border-2 border-neutral-200 bg-white overflow-hidden">
                    <button
                      onClick={() => setSelectedQty((v) => Math.max(1, v - 1))}
                      className="px-3 py-2 text-primary-600 font-bold text-lg hover:bg-primary-50 transition-colors"
                      aria-label="Decrease"
                    >−</button>
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={selectedQty}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(maxQty, Number(e.target.value) || 1));
                        setSelectedQty(v);
                      }}
                      className="w-14 text-center text-sm font-black text-neutral-900 focus:outline-none bg-transparent py-2"
                    />
                    <button
                      onClick={() => setSelectedQty((v) => Math.min(maxQty, v + 1))}
                      className="px-3 py-2 text-primary-600 font-bold text-lg hover:bg-primary-50 transition-colors"
                      aria-label="Increase"
                    >+</button>
                  </div>
                  {stockQty !== null && (
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      Max: {stockQty}
                    </span>
                  )}
                </div>

                {/* Price breakdown */}
                <div className="mt-4 rounded-xl border border-primary-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {formatPrice(product.price)} × {selectedQty} {isWeightUnit ? (unitNum > 1 ? 'packs' : 'kg') : 'unit(s)'}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-black text-neutral-900">{formatPrice(totalPrice)}</span>
                      {discount > 0 && (
                        <span className="ml-2 text-xs text-neutral-400 line-through">{formatPrice(totalMrp)}</span>
                      )}
                    </div>
                  </div>
                  {discount > 0 && (
                    <p className="mt-1 text-right text-[10px] font-bold text-green-600">
                      You save {formatPrice(totalMrp - totalPrice)} ({discount}% OFF)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Similar Products ── */}
            {similarProducts.length > 0 && (
              <div className="px-5 pb-4 mt-2">
                <p className="mb-3 text-sm font-bold text-neutral-800">Similar Products</p>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {similarProducts.map((sp) => {
                    const spDiscount = sp.mrp > sp.price
                      ? Math.round(((sp.mrp - sp.price) / sp.mrp) * 100) : 0;
                    return (
                      <button
                        key={sp.id}
                        onClick={() => openSheet(sp)}
                        className="flex-none w-28 rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-md hover:border-primary-200 transition-all text-left active:scale-95"
                      >
                        {/* Image */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-neutral-50">
                          {spDiscount > 0 && (
                            <span className="absolute left-1 top-1 z-10 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                              {spDiscount}%
                            </span>
                          )}
                          {sp.imageUrls?.[0] ? (
                            <img
                              src={sp.imageUrls[0]}
                              alt={sp.name}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-2xl">🌿</div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="p-2">
                          <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-neutral-800">{sp.name}</p>
                          <p className="mt-0.5 text-[9px] text-neutral-400">{sp.unit}</p>
                          <p className="mt-1 text-xs font-black text-neutral-900">{formatPrice(sp.price)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Sticky CTA ── */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-100 bg-white/95 p-4 backdrop-blur-lg">
              {quantity > 0 ? (
                <div className="flex items-center gap-3">
                  {/* Cart qty stepper */}
                  <div className="flex items-center gap-4 rounded-2xl bg-green-50 px-4 py-3">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="text-primary-600 transition-transform active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="min-w-[24px] text-center text-base font-black text-neutral-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="text-primary-600 transition-transform active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Add selected qty to cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={stockExceeded || !product.inStock}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-md transition-all active:scale-[0.98]',
                      stockExceeded || !product.inStock
                        ? 'bg-neutral-300 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700',
                    )}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {stockExceeded
                      ? `Only ${stockQty} available`
                      : !product.inStock
                      ? 'Out of Stock'
                      : `Add ${selectedQty} more`}
                  </button>
                </div>
              ) : (
                /* First-time add */
                <button
                  onClick={handleAddToCart}
                  disabled={stockExceeded || !product.inStock}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white shadow-lg transition-all active:scale-[0.98]',
                    stockExceeded || !product.inStock
                      ? 'bg-neutral-300 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700',
                  )}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {stockExceeded
                    ? `Only ${stockQty} ${isWeightUnit ? unitLabel : 'units'} available`
                    : !product.inStock
                    ? 'Out of Stock'
                    : `Add to Cart — ${formatPrice(totalPrice)}`}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
