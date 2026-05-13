'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Plus, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import { useProductDetailStore } from '@/store/productDetailStore';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

const RECENT_KEY = 'qc-recent-searches';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]; }
  catch { return []; }
}
function saveRecent(q: string) {
  try {
    const prev = getRecent().filter((s) => s !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
  } catch { /**/ }
}

const POPULAR = ['Tomato', 'Mango', 'Rice', 'Jaggery', 'Groundnut Oil', 'Organic Milk', 'Banana', 'Turmeric', 'Spinach', 'Coconut Oil'];

export function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent]   = useState<string[]>([]);

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isSearchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSearchOpen]);

  /* escape key */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSearch]);

  /* load recent + autofocus when opening */
  useEffect(() => {
    if (isSearchOpen) {
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  /* debounced search */
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q.trim())}&limit=30`);
      if (!res.ok) { setResults([]); return; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as any;
      const items: Product[] =
        Array.isArray(json?.data?.data) ? (json.data.data as Product[]) :
        Array.isArray(json?.data)       ? (json.data as Product[])       : [];
      setResults(items);
      if (items.length > 0) { saveRecent(q.trim()); setRecent(getRecent()); }
    } catch { setResults([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void doSearch(query); }, 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const showIdle    = !isLoading && !query.trim();
  const showEmpty   = !isLoading && query.trim().length > 0 && results.length === 0;
  const showResults = !isLoading && results.length > 0;

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* ── Backdrop (dim the page behind — but header stays above z-[6000]) ── */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSearch}
            className="fixed inset-0 z-[6500] bg-black/40"
          />

          {/* ── Search panel — slides down from just below the header (top-16) ── */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'fixed left-0 right-0 top-16 z-[7000]',           // sits just below header (h-16)
              'mx-auto max-w-screen-xl',
              'flex flex-col bg-white shadow-2xl',
              'rounded-b-3xl overflow-hidden',
              'max-h-[calc(100vh-4rem)]',                        // never taller than viewport minus header
            )}
            role="search"
            aria-label="Search products"
          >
            {/* ── Search input bar ── */}
            <div className="flex shrink-0 items-center gap-2 border-b border-neutral-100 bg-white px-3 py-3">
              <button
                onClick={closeSearch}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search groceries, brands, categories…"
                  className="h-11 w-full rounded-2xl border border-neutral-200 bg-neutral-50 pl-10 pr-10 text-sm font-medium placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Scrollable results area ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain" aria-live="polite">

              {/* Loading skeletons */}
              {isLoading && (
                <div className="px-4 pt-4 pb-2">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                        <div className="aspect-square animate-pulse bg-neutral-100" />
                        <div className="space-y-1.5 p-2">
                          <div className="h-2.5 w-4/5 animate-pulse rounded bg-neutral-100" />
                          <div className="h-2 w-1/3 animate-pulse rounded bg-neutral-100" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {showEmpty && (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  <Search className="h-10 w-10 text-neutral-200" />
                  <p className="text-sm font-bold text-neutral-700">No results for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-neutral-400">Try a different word or browse categories below.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {POPULAR.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results grid */}
              {showResults && (
                <div className="px-4 pt-3 pb-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                    {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {results.map((product) => (
                      <SearchProductCard key={product.id} product={product} onClose={closeSearch} />
                    ))}
                  </div>
                </div>
              )}

              {/* Idle state — recent + popular */}
              {showIdle && (
                <div className="px-4 pt-4 pb-5 space-y-5">
                  {recent.length > 0 && (
                    <section>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-neutral-400">Recent</p>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((s) => (
                          <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                          >
                            <Clock className="h-3 w-3 text-neutral-400 shrink-0" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-neutral-400">Popular Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Compact product card for search results ── */
function SearchProductCard({ product, onClose }: { product: Product; onClose: () => void }) {
  const openSheet = useProductDetailStore((s) => s.openSheet);
  const addItem   = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const addToast  = useUIStore((s) => s.addToast);

  const cartQty  = cartItems.find((i) => i.productId === product.id)?.quantity ?? 0;
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!product.inStock) return;
    addItem(product, 1);
    addToast({ title: `${product.name} added`, variant: 'success' });
  }

  function handleOpen() {
    openSheet(product);
    onClose(); // close search so product sheet is visible
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        {!product.inStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[9px] font-bold text-neutral-600">Out of Stock</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-1 top-1 z-10 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            {discount}%
          </span>
        )}
        {product.imageUrls[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 33vw, 20vw"
            className={cn('object-contain p-1.5 transition-transform group-hover:scale-105', !product.inStock && 'grayscale')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🌿</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-neutral-800">{product.name}</p>
        <p className="text-[10px] text-neutral-400">{product.unit}</p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="text-xs font-black text-neutral-900">{formatPrice(product.price)}</span>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            aria-label={`Add ${product.name}`}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white transition-colors',
              product.inStock ? 'bg-primary-600 hover:bg-primary-700' : 'bg-neutral-200 cursor-not-allowed',
            )}
          >
            {cartQty > 0
              ? <span className="text-[10px] font-black">{cartQty}</span>
              : <Plus className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
