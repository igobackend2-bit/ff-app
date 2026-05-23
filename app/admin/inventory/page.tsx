'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, BarChart3, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryRow {
  productId:  string;
  invId:      string | null;
  name:       string;
  slug:       string;
  sku:        string;
  unit:       string;
  imageUrls:  string;
  price:      number;
  inStock:    boolean;
  quantity:   number;
  threshold:  number;
  store:      { id: string; name: string };
}

// ── Inline qty editor ──────────────────────────────────────────────────────
function QtyEditor({ row, onSaved }: { row: InventoryRow; onSaved: (qty: number, inStock: boolean) => void }) {
  const [editing, setEditing]   = useState(false);
  const [value,   setValue]     = useState(String(row.quantity));
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [error,   setError]     = useState('');
  const inputRef                = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setValue(String(row.quantity));
    setEditing(true);
    setError('');
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const cancel = () => { setEditing(false); setError(''); };

  const save = async () => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) { setError('Enter a valid number ≥ 0'); return; }
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/admin/inventory/update', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ productId: row.productId, quantity: qty }),
      });
      const data = await res.json() as { ok?: boolean; quantity?: number; inStock?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Save failed');
      onSaved(data.quantity ?? qty, data.inStock ?? qty > 0);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="number" min="0" value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void save(); if (e.key === 'Escape') cancel(); }}
            className="w-20 rounded-lg border border-primary-400 px-2 py-1 text-center text-sm font-bold text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <button onClick={() => void save()} disabled={saving}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button onClick={cancel}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-200 text-neutral-600 hover:bg-neutral-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {error && <p className="text-[10px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={startEdit}
        title="Click to edit quantity"
        className={cn(
          'inline-flex h-8 min-w-[40px] items-center justify-center rounded-lg px-3 text-sm font-black transition-all hover:scale-105 hover:shadow-md cursor-pointer',
          saved
            ? 'bg-emerald-500 text-white'
            : row.quantity === 0
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : row.quantity <= row.threshold
            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200',
        )}
      >
        {saved ? <Check className="h-4 w-4" /> : row.quantity}
      </button>
      {saved && <span className="text-[9px] font-semibold text-emerald-600">Saved!</span>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminInventoryPage() {
  const [rows,    setRows]    = useState<InventoryRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'low' | 'out'>('all');
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search)         params.set('q', search);
      if (filter !== 'all') params.set('stock', filter);
      const res  = await fetch(`/api/admin/inventory?${params}`);
      const data = await res.json() as { rows: InventoryRow[]; total: number; pages: number };
      setRows(data.rows   ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { void fetchInventory(); }, [fetchInventory]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void fetchInventory(); };

  const handleQtySaved = (productId: string, qty: number, inStock: boolean) => {
    setRows((prev) => prev.map((r) =>
      r.productId === productId ? { ...r, quantity: qty, inStock } : r,
    ));
  };

  const getImageSrc = (imageUrls: string) => {
    try { return (JSON.parse(imageUrls) as string[])[0] ?? ''; }
    catch { return imageUrls ?? ''; }
  };

  const stockBadge = (row: InventoryRow) => {
    if (!row.inStock || row.quantity === 0)
      return <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Out of Stock</span>;
    if (row.quantity <= row.threshold)
      return <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">Low Stock</span>;
    return <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">In Stock</span>;
  };

  const lowCount = rows.filter((r) => r.quantity > 0 && r.quantity <= r.threshold).length;
  const outCount = rows.filter((r) => r.quantity === 0 || !r.inStock).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Inventory</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{total} products • Click any qty to edit</p>
        </div>
        <button onClick={() => void fetchInventory()} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
          <RefreshCw className="h-4 w-4" /> Refresh
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

      {/* Hint */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-2.5 text-xs text-primary-700">
        <BarChart3 className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Click any green/orange/red number</strong> to edit the stock quantity.
          Typing a new value and pressing ✓ or Enter will save it — stock status updates automatically.
        </span>
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
              {f === 'all' ? 'All' : f === 'low' ? '⚠️ Low Stock' : '❌ Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading inventory…
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
                <th className="px-5 py-3 text-center">Qty (click to edit)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const imgSrc = getImageSrc(row.imageUrls);
                return (
                  <tr key={row.productId} className="border-b border-neutral-50 transition-colors hover:bg-neutral-50/60 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {imgSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgSrc} alt={row.name}
                            className="h-10 w-10 rounded-xl object-cover border border-neutral-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                            <BarChart3 className="h-4 w-4 text-neutral-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900">{row.name}</p>
                          <p className="text-xs text-neutral-400">{row.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500">{row.sku}</td>
                    <td className="px-5 py-3 text-xs text-neutral-600">{row.store.name}</td>
                    <td className="px-5 py-3 text-center">
                      <QtyEditor
                        row={row}
                        onSaved={(qty, inStock) => handleQtySaved(row.productId, qty, inStock)}
                      />
                    </td>
                    <td className="px-5 py-3">{stockBadge(row)}</td>
                    <td className="px-5 py-3 text-right font-bold text-neutral-900">₹{row.price}</td>
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
