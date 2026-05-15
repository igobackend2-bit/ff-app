'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryRow {
  id: string;
  quantity: number;
  threshold: number;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    unit: string;
    imageUrls: string;
    price: number;
    inStock: boolean;
  };
  darkStore: { id: string; name: string; city: string };
}

export default function AdminInventoryPage() {
  const [rows, setRows]       = useState<InventoryRow[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all' | 'low' | 'out'>('all');
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('q', search);
      if (filter !== 'all') params.set('stock', filter === 'out' ? 'out' : 'in');

      // Reuse admin products endpoint + augment with inventory data from a dedicated call
      const [productsRes] = await Promise.all([
        fetch(`/api/admin/products?${params}`),
      ]);
      const productsData = await productsRes.json() as {
        products: Array<{
          id: string; name: string; slug: string; sku: string; unit: string;
          imageUrls: string[]; price: number; inStock: boolean;
        }>;
        total: number; pages: number;
      };

      // Build synthetic inventory rows from products
      const syntheticRows: InventoryRow[] = (productsData.products ?? []).map((p) => ({
        id: p.id,
        quantity: p.inStock ? 100 : 0,   // placeholder until real inventory records exist
        threshold: 10,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          unit: p.unit,
          imageUrls: JSON.stringify(p.imageUrls ?? []),
          price: p.price,
          inStock: p.inStock,
        },
        darkStore: { id: 'default', name: 'Main Store', city: 'Chennai' },
      }));

      // Apply low-stock filter client-side
      const filtered = filter === 'low'
        ? syntheticRows.filter((r) => r.quantity > 0 && r.quantity <= r.threshold)
        : filter === 'out'
          ? syntheticRows.filter((r) => r.quantity === 0 || !r.product.inStock)
          : syntheticRows;

      setRows(filtered);
      setTotal(productsData.total ?? 0);
      setPages(productsData.pages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { void fetchInventory(); }, [fetchInventory]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void fetchInventory(); };

  const getImageSrc = (imageUrls: string) => {
    try {
      const arr = JSON.parse(imageUrls) as string[];
      return arr[0] ?? '';
    } catch { return imageUrls ?? ''; }
  };

  const stockBadge = (row: InventoryRow) => {
    if (!row.product.inStock || row.quantity === 0)
      return <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Out of Stock</span>;
    if (row.quantity <= row.threshold)
      return <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">Low Stock</span>;
    return <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">In Stock</span>;
  };

  const lowCount = rows.filter((r) => r.quantity > 0 && r.quantity <= r.threshold).length;
  const outCount = rows.filter((r) => r.quantity === 0 || !r.product.inStock).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Inventory</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{total} products tracked</p>
        </div>
        <button onClick={() => void fetchInventory()} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
          <RefreshCw className="h-4 w-4" />Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Total Products', value: total,    color: 'bg-blue-500',   icon: BarChart3 },
          { label: 'Low Stock',      value: lowCount, color: 'bg-orange-500', icon: AlertTriangle },
          { label: 'Out of Stock',   value: outCount, color: 'bg-red-500',    icon: AlertTriangle },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500">{c.label}</p>
              <p className="text-2xl font-black text-neutral-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 min-w-[200px] gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name or SKU…"
              className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <button type="submit" className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700">Go</button>
        </form>

        <div className="flex gap-2">
          {(['all', 'low', 'out'] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={cn('rounded-xl border px-3 py-2 text-xs font-bold transition-colors',
                filter === f
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50')}>
              {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />Loading inventory…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <BarChart3 className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">No products found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const imgSrc = getImageSrc(row.product.imageUrls);
                return (
                  <tr key={row.id} className="border-b border-neutral-50 transition-colors hover:bg-neutral-50/60 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {imgSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgSrc} alt={row.product.name}
                            className="h-10 w-10 rounded-xl object-cover border border-neutral-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-300">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900">{row.product.name}</p>
                          <p className="text-xs text-neutral-400">{row.product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500">{row.product.sku}</td>
                    <td className="px-5 py-3 text-xs text-neutral-600">{row.darkStore.name}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn('inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg px-2 text-xs font-black',
                        row.quantity === 0 ? 'bg-red-100 text-red-700'
                          : row.quantity <= row.threshold ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700')}>
                        {row.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3">{stockBadge(row)}</td>
                    <td className="px-5 py-3 text-right font-bold text-neutral-900">₹{row.product.price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-neutral-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white disabled:opacity-40 hover:bg-neutral-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
