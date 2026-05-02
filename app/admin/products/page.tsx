'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Package, AlertTriangle, ToggleLeft, ToggleRight, Pencil, Trash2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  unit: string;
  price: number;
  mrp: number;
  inStock: boolean;
  isFeatured: boolean;
  imageUrls: string;
  category: { name: string; slug: string } | null;
  brand: { name: string } | null;
}

interface ApiResponse {
  products: Product[];
  total: number;
  pages: number;
}

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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search && { q: search }),
        ...(stockFilter !== 'all' && { stock: stockFilter }),
      });
      const res = await fetch(`/api/admin/products?${params}`);
      const data: ApiResponse = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, stockFilter]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  const toggleStock = async (product: Product) => {
    setTogglingId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !product.inStock }),
      });
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, inStock: !p.inStock } : p),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setDeletingId(null);
    }
  };

  const getImages = (imageUrls: string): string[] => {
    try { return JSON.parse(imageUrls) as string[]; }
    catch { return []; }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Products</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{total} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'in', 'out'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setStockFilter(f); setPage(1); }}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                stockFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
              )}
            >
              {f === 'all' ? 'All' : f === 'in' ? '✅ In Stock' : '⚠️ Out of Stock'}
            </button>
          ))}
          <button
            onClick={() => void fetchProducts()}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Package className="mb-3 h-10 w-10" />
            <p className="text-sm font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                <AnimatePresence>
                  {products.map((product) => {
                    const images = getImages(product.imageUrls);
                    return (
                      <motion.tr
                        key={product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'transition-colors hover:bg-neutral-50',
                          !product.inStock && 'bg-red-50/30',
                        )}
                      >
                        {/* Product */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                              {images[0] ? (
                                <Image
                                  src={images[0]}
                                  alt={product.name}
                                  fill
                                  sizes="40px"
                                  className="object-contain p-0.5"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-neutral-300 m-auto mt-2" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-neutral-900 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-neutral-400">{product.unit}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 text-neutral-500">
                          {product.category?.name ?? '—'}
                        </td>

                        {/* Brand */}
                        <td className="px-4 py-3 text-neutral-500">
                          {product.brand?.name ?? '—'}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-neutral-900">₹{product.price}</span>
                          {product.mrp > product.price && (
                            <span className="ml-1.5 text-xs text-neutral-400 line-through">₹{product.mrp}</span>
                          )}
                        </td>

                        {/* Stock toggle */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => void toggleStock(product)}
                            disabled={togglingId === product.id}
                            aria-label={product.inStock ? 'Mark out of stock' : 'Mark in stock'}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
                          >
                            {product.inStock ? (
                              <>
                                <ToggleRight className="h-5 w-5 text-primary-500" />
                                <span className="text-primary-600">In Stock</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-5 w-5 text-red-400" />
                                <span className="text-red-500">Out of Stock</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => void deleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50 disabled:opacity-50"
                              aria-label={`Delete ${product.name}`}
                            >
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-3">
            <p className="text-xs text-neutral-500">
              Page {page} of {pages} — {total} products
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Out of stock alert */}
      {products.some((p) => !p.inStock) && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {products.filter((p) => !p.inStock).length} product(s) on this page are out of stock.
            Use the toggle to update availability.
          </span>
        </div>
      )}
    </div>
  );
}
