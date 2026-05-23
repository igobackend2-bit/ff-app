'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Package, AlertTriangle, ToggleLeft, ToggleRight, Pencil, Trash2, RefreshCw, LayoutGrid, List, Star, TrendingUp, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Product {
  id: string; name: string; slug: string; unit: string; price: number; mrp: number;
  inStock: boolean; isFeatured: boolean; imageUrls: string | string[];
  category: { name: string; slug: string } | null; brand: { name: string } | null;
  averageRating?: number; reviewCount?: number; orderCount?: number;
}
interface ApiResponse { products: Product[]; total: number; pages: number; }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'orders'>('newest');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort: sortBy,
        ...(search && { q: search }), ...(stockFilter !== 'all' && { stock: stockFilter }) });
      const res = await fetch(`/api/admin/products?${params}`);
      const data: ApiResponse = await res.json();
      setProducts(data.products ?? []); setTotal(data.total ?? 0); setPages(data.pages ?? 1);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, search, stockFilter, sortBy]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  const toggleStock = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}/stock`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !product.inStock }),
      });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, inStock: !p.inStock } : p));
    } finally { setTogglingId(null); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } finally { setDeletingId(null); }
  };

  const getImages = (imageUrls: string | string[]): string[] => {
    if (Array.isArray(imageUrls)) return imageUrls;
    try { return JSON.parse(imageUrls) as string[]; } catch { return []; }
  };

  const Pagination = () => pages > 1 ? (
    <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-3">
      <p className="text-xs text-neutral-500">Page {page} of {pages} — {total} products</p>
      <div className="flex gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40">← Prev</button>
        <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40">Next →</button>
      </div>
    </div>
  ) : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Products</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{total} total products</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <button onClick={() => { setSortBy('newest'); setPage(1); }}
              className={cn('flex items-center gap-1 px-3 py-2 text-xs font-semibold transition-colors',
                sortBy === 'newest' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50')}>
              Newest
            </button>
            <button onClick={() => { setSortBy('orders'); setPage(1); }}
              className={cn('flex items-center gap-1 px-3 py-2 text-xs font-semibold transition-colors',
                sortBy === 'orders' ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:bg-neutral-50')}>
              <TrendingUp className="h-3 w-3" /> Most Ordered
            </button>
            <button onClick={() => { setSortBy('rating'); setPage(1); }}
              className={cn('flex items-center gap-1 px-3 py-2 text-xs font-semibold transition-colors',
                sortBy === 'rating' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50')}>
              <Star className="h-3 w-3" /> Rating
            </button>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <button onClick={() => setViewMode('table')}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors',
                viewMode === 'table' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50')}>
              <List className="h-3.5 w-3.5" /> Table
            </button>
            <button onClick={() => setViewMode('grid')}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors',
                viewMode === 'grid' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-50')}>
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
          </div>
          <Link href="/admin/products/new"
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input type="search" placeholder="Search products..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100" />
        </div>
        <div className="flex gap-2">
          {(['all', 'in', 'out'] as const).map((f) => (
            <button key={f} onClick={() => { setStockFilter(f); setPage(1); }}
              className={cn('rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                stockFilter === f ? 'bg-primary-600 text-white' : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50')}>
              {f === 'all' ? 'All' : f === 'in' ? '✅ In Stock' : '⚠️ Out of Stock'}
            </button>
          ))}
          <button onClick={() => void fetchProducts()}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-100 bg-white py-16 text-neutral-400">
              <Package className="mb-3 h-10 w-10" /><p className="text-sm font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <AnimatePresence>
                {products.map((product, idx) => {
                  const images = getImages(product.imageUrls);
                  const globalIdx = (page - 1) * 20 + idx + 1;
                  return (
                    <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className={cn('group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md',
                        product.inStock ? 'border-neutral-100' : 'border-red-100')}>
                      <div className={cn('absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white shadow',
                        globalIdx <= 3 ? 'bg-primary-600' : 'bg-neutral-500')}>{globalIdx}</div>
                      {(product.orderCount ?? 0) > 0 && (
                        <div className="absolute left-2 top-10 z-10 flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                          🔥 {product.orderCount}x
                        </div>
                      )}
                      <div className={cn('absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold',
                        product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                        {product.inStock ? 'In Stock' : 'Out'}
                      </div>
                      <div className="relative h-36 w-full overflow-hidden bg-neutral-50">
                        {images[0]
                          ? <Image src={images[0]} alt={product.name} fill sizes="200px" className="object-contain p-3" />
                          : <Package className="m-auto mt-12 h-10 w-10 text-neutral-200" />}
                        {images.length > 1 && (
                          <div className="absolute bottom-1 right-1 flex gap-0.5">
                            {images.slice(1, 4).map((u, i) => (
                              <div key={i} className="relative h-7 w-7 overflow-hidden rounded border border-white bg-white shadow">
                                <Image src={u} alt="" fill sizes="28px" className="object-contain" />
                              </div>
                            ))}
                            {images.length > 4 && (
                              <div className="flex h-7 w-7 items-center justify-center rounded border border-white bg-neutral-800 text-[9px] font-bold text-white shadow">+{images.length - 4}</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <p className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-900">{product.name}</p>
                        <p className="text-[10px] text-neutral-400">{product.category?.name ?? '—'} · {product.unit}</p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div>
                            <span className="text-sm font-black text-neutral-900">₹{product.price}</span>
                            {product.mrp > product.price && <span className="ml-1 text-[10px] text-neutral-400 line-through">₹{product.mrp}</span>}
                          </div>
                          {(product.orderCount ?? 0) > 0 ? (
                            <div className="flex items-center gap-0.5">
                              <ShoppingBag className="h-3 w-3 text-orange-500" />
                              <span className="text-[10px] font-bold text-orange-600">{product.orderCount}</span>
                            </div>
                          ) : (product.averageRating ?? 0) > 0 ? (
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-[10px] font-semibold text-neutral-600">{(product.averageRating ?? 0).toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
                        <div className="flex border-t border-neutral-100 bg-white">
                          <Link href={`/admin/products/${product.id}/edit`}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-primary-600 hover:bg-primary-50">
                            <Pencil className="h-3 w-3" /> Edit
                          </Link>
                          <div className="w-px bg-neutral-100" />
                          <button onClick={() => void toggleStock(product)} disabled={togglingId === product.id}
                            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold disabled:opacity-50">
                            {product.inStock
                              ? <span className="flex items-center gap-1"><ToggleRight className="h-3 w-3 text-primary-500" /><span className="text-primary-600">Stock</span></span>
                              : <span className="flex items-center gap-1"><ToggleLeft className="h-3 w-3 text-red-400" /><span className="text-red-500">Off</span></span>}
                          </button>
                          <div className="w-px bg-neutral-100" />
                          <button onClick={() => void deleteProduct(product.id)} disabled={deletingId === product.id}
                            className="flex flex-1 items-center justify-center py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
          <Pagination />
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <Package className="mb-3 h-10 w-10" /><p className="text-sm font-medium">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  <AnimatePresence>
                    {products.map((product, idx) => {
                      const images = getImages(product.imageUrls);
                      const globalIdx = (page - 1) * 20 + idx + 1;
                      return (
                        <motion.tr key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className={cn('transition-colors hover:bg-neutral-50', !product.inStock && 'bg-red-50/30')}>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white',
                              globalIdx <= 3 ? 'bg-primary-500' : 'bg-neutral-300')}>{globalIdx}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                                {images[0]
                                  ? <Image src={images[0]} alt={product.name} fill sizes="40px" className="object-contain p-0.5" />
                                  : <Package className="h-5 w-5 text-neutral-300 m-auto mt-2" />}
                              </div>
                              {images.slice(1, 3).map((u, i) => (
                                <div key={i} className="relative hidden h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-neutral-100 bg-neutral-50 sm:block">
                                  <Image src={u} alt="" fill sizes="32px" className="object-contain p-0.5" />
                                </div>
                              ))}
                              {images.length > 3 && (
                                <div className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-neutral-100 bg-neutral-100 text-[10px] font-bold text-neutral-500 sm:flex">
                                  +{images.length - 3}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-900 line-clamp-1">{product.name}</p>
                                <p className="text-xs text-neutral-400">{product.unit}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-500">{product.category?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-neutral-500">{product.brand?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-neutral-900">₹{product.price}</span>
                            {product.mrp > product.price && <span className="ml-1.5 text-xs text-neutral-400 line-through">₹{product.mrp}</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {(product.orderCount ?? 0) > 0
                              ? <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600 border border-orange-200">🔥 {product.orderCount}</span>
                              : <span className="text-xs text-neutral-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => void toggleStock(product)} disabled={togglingId === product.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity disabled:opacity-50">
                              {product.inStock
                                ? <span className="flex items-center gap-1.5"><ToggleRight className="h-5 w-5 text-primary-500" /><span className="text-primary-600">In Stock</span></span>
                                : <span className="flex items-center gap-1.5"><ToggleLeft className="h-5 w-5 text-red-400" /><span className="text-red-500">Out of Stock</span></span>}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link href={`/admin/products/${product.id}/edit`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100">
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                              <button onClick={() => void deleteProduct(product.id)} disabled={deletingId === product.id}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50 disabled:opacity-50">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
          <Pagination />
        </div>
      )}

      {products.some((p) => !p.inStock) && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{products.filter((p) => !p.inStock).length} product(s) on this page are out of stock.</span>
        </div>
      )}
    </div>
  );
}
