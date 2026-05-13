'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingCart, Plus, Minus, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProductDetailStore } from '@/store/productDetailStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn, formatPrice, discountPercent } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

/* ── helpers ── */
function extractNumericUnit(unit: string): number {
  const m = unit.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1] ?? '1') : 1;
}

export function ProductDetailSheet() {
  const { isOpen, product, closeSheet } = useProductDetailStore();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems = useCartStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => product ? s.isWishlisted(product.id) : false);
  const addToast = useUIStore((s) => s.addToast);
  const [currentImg, setCurrentImg] = useState(0);

  // Weight / quantity selector state
  const [selectedQty, setSelectedQty] = useState(1);

  const cartItem = product ? cartItems.find((item) => item.productId === product.id) : null;
  const quantity = cartItem?.quantity ?? 0;

  // Reset image index + qty when product changes
  useEffect(() => { setCurrentImg(0); setSelectedQty(1); }, [product?.id]);

  // Auto-advance image slider every 3 seconds
  useEffect(() => {
    if (!isOpen || !product || product.imageUrls.length <= 1) return;
    const t = setInterval(() => setCurrentImg(i => (i + 1) % product.imageUrls.length), 3000);
    return () => clearInterval(t);
  }, [isOpen, product]);

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
  const images = product?.imageUrls ?? [];

  // Weight selector derived values
  const unitNum = product ? extractNumericUnit(product.unit) : 1;
  const isWeightUnit = product ? /kg|g\b|gm|gram|litre|ltr|ml|l\b/i.test(product.unit) : false;
  const maxQty = 30;
  const totalWeight = selectedQty * unitNum;
  const unitLabel = product?.unit ?? '';
  const totalPrice = product ? product.price * selectedQty : 0;
  const totalMrp   = product ? product.mrp   * selectedQty : 0;

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

            {/* ── Image Slider ── */}
            <div className="relative h-64 w-full overflow-hidden bg-green-50">
              {images.length > 0 ? (
                <>
                  <div
                    className="flex h-full transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)]"
                    style={{ transform: `translateX(-${currentImg * 100}%)` }}
                  >
                    {images.map((url, i) => (
                      <div key={i} className="relative min-w-full h-full flex-shrink-0">
                        <Image
                          src={url}
                          alt={`${product.name} ${i + 1}`}
                          fill
                          priority={i === 0}
                          className="object-contain p-4"
                          sizes="390px"
                        />
                      </div>
                    ))}
                  </div>
                  {/* Dots indicator */}
                  {images.length > 1 && (
                    <>
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImg(i)}
                            className={cn(
                              'rounded-full transition-all duration-300',
                              i === currentImg ? 'w-5 h-2 bg-primary-600' : 'w-2 h-2 bg-neutral-300',
                            )}
                          />
                        ))}
                      </div>
                      {/* Arrow buttons */}
                      <button
                        onClick={() => setCurrentImg(i => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentImg(i => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-7xl">
                  🌿
                </div>
              )}
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
              <div className="mt-6 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-800">
                    {isWeightUnit ? 'Select Weight' : 'Select Quantity'}
                  </span>
                  <span className="rounded-xl bg-primary-600 px-3 py-1 text-sm font-black text-white">
                    {isWeightUnit
                      ? `${totalWeight % 1 === 0 ? totalWeight : totalWeight.toFixed(1)} ${unitLabel.replace(/\d+(?:\.\d+)?\s*/g, '').trim() || 'kg'}`
                      : `${selectedQty} × ${unitLabel}`}
                  </span>
                </div>

                {/* Slider */}
                <div className="relative mt-1">
                  <input
                    type="range"
                    min={1}
                    max={maxQty}
                    step={1}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    className="w-full accent-primary-600"
                    style={{ accentColor: '#16a34a' }}
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-semibold text-neutral-400">
                    <span>{isWeightUnit ? `${unitNum} ${unitLabel.replace(/[\d.]+\s*/,'').trim() || 'kg'}` : '1'}</span>
                    <span>{isWeightUnit ? `${maxQty * unitNum} ${unitLabel.replace(/[\d.]+\s*/,'').trim() || 'kg'}` : `${maxQty}`}</span>
                  </div>
                </div>

                {/* Quick pick buttons */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {[1, 2, 5, 10, 15, 20].filter(q => q <= maxQty).map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQty(q)}
                      className={cn(
                        'rounded-xl border px-3 py-1.5 text-xs font-bold transition-all',
                        selectedQty === q
                          ? 'border-primary-500 bg-primary-600 text-white'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300',
                      )}
                    >
                      {isWeightUnit ? `${q * unitNum}${unitLabel.replace(/[\d.]+\s*/,'').trim() || 'kg'}` : `×${q}`}
                    </button>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="mt-4 rounded-xl border border-primary-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {formatPrice(product.price)} × {selectedQty} {isWeightUnit ? (unitNum > 1 ? `packs` : `kg`) : 'unit(s)'}
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

            {/* ── Sticky CTA ── */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-100 bg-white/95 p-4 backdrop-blur-lg">
              {quantity > 0 ? (
                <div className="flex items-center gap-3">
                  {/* Cart qty stepper */}
                  <div className="flex items-center gap-4 rounded-2xl bg-green-50 px-4 py-3">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="text-primary-600 transition-transform active:scale-90"
                      aria-label="Remove one"
                    >
                      <Minus className="h-5 w-5 stroke-[3]" />
                    </button>
                    <span className="min-w-[1.5rem] text-center text-lg font-black text-primary-700">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="text-primary-600 transition-transform active:scale-90"
                      aria-label="Add one more"
                    >
                      <Plus className="h-5 w-5 stroke-[3]" />
                    </button>
                  </div>
                  {/* Add more with selected qty */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]"
                  >
                    + {selectedQty} more · {formatPrice(totalPrice)}
                  </button>
                  <button
                    onClick={closeSheet}
                    className="rounded-2xl border border-neutral-200 px-4 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    View Cart
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={cn(
                    'flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold shadow-lg transition-all active:scale-[0.98]',
                    product.inStock
                      ? 'bg-primary-600 text-white shadow-primary-200'
                      : 'cursor-not-allowed bg-neutral-200 text-neutral-400 shadow-none',
                  )}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {product.inStock
                    ? `🛒 Add to Cart · ${formatPrice(totalPrice)}`
                    : 'Out of Stock'}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
