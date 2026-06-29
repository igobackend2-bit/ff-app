'use client';
// Admin Dashboard — with inline product search + most liked products
import { useState, useEffect, useRef, useCallback } from 'react';
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle, CheckCircle, Search, X, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Stats {
  products: number;
  inStock: number;
  outOfStock: number;
  orders: number;
  pendingOrders: number;
  recentOrders: number;
  users: number;
  totalRevenue: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  unit: string;
  price: number;
  mrp: number;
  inStock: boolean;
  imageUrls: string | string[];
  category: { name: string } | null;
  brand: { name: string } | null;
  averageRating?: number;
  reviewCount?: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            'h-3 w-3',
            s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-neutral-200 text-neutral-200',
          )}
        />
      ))}
      <span className="ml-1 text-[10px] font-semibold text-neutral-500">{rating.toFixed(1)}</span>
    </div>
  );
}

function getFirstImage(imageUrls: string | string[]): string {
  if (Array.isArray(imageUrls)) return imageUrls[0] ?? '';
  try { return (JSON.parse(imageUrls) as string[])[0] ?? ''; }
  catch { return imageUrls || ''; }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Inline product search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Most liked / top rated products
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [topLoading, setTopLoading] = useState(true);

  // Delivery minimum order config
  const [minOrder, setMinOrder]       = useState(600);
  const [minInput, setMinInput]       = useState('600');
  const [minSaving, setMinSaving]     = useState(false);
  const [minSaved,  setMinSaved]      = useState(false);

  // Load stats on mount
  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d: { data: Stats }) => setStats(d.data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  // Load delivery config
  useEffect(() => {
    fetch('/api/admin/delivery-config')
      .then((r) => r.json())
      .then((d: { min_order_amount?: number }) => {
        if (d.min_order_amount) { setMinOrder(d.min_order_amount); setMinInput(String(d.min_order_amount)); }
      })
      .catch(() => {});
  }, []);

  const saveMinOrder = async () => {
    const val = Number(minInput);
    if (isNaN(val) || val < 0) return;
    setMinSaving(true); setMinSaved(false);
    try {
      await fetch('/api/admin/delivery-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_order_amount: val }),
      });
      setMinOrder(val); setMinSaved(true);
      setTimeout(() => setMinSaved(false), 3000);
    } catch { /* ignore */ } finally { setMinSaving(false); }
  };

  // Load top rated products
  useEffect(() => {
    fetch('/api/admin/products?sort=rating&limit=8')
      .then((r) => r.json())
      .then((d: { products: Product[] }) => setTopProducts(d.products ?? []))
      .catch(() => setTopProducts([]))
      .finally(() => setTopLoading(false));
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/products?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json() as { products: Product[] };
      setResults(data.products ?? []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void doSearch(val), 350);
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
    setSearched(false);
  }

  const cards = stats ? [
    { title: 'Total Products',  value: stats.products,     sub: `${stats.inStock} in stock`,           icon: Package,       color: 'bg-blue-500',                                                    href: '/admin/products' },
    { title: 'Out of Stock',    value: stats.outOfStock,   sub: 'Need restocking',                     icon: AlertTriangle, color: stats.outOfStock > 0 ? 'bg-red-500' : 'bg-green-500',             href: '/admin/products?stock=out' },
    { title: 'Total Orders',    value: stats.orders,       sub: `${stats.recentOrders} this week`,     icon: ShoppingBag,   color: 'bg-violet-500',                                                  href: '/admin/orders' },
    { title: 'Pending Orders',  value: stats.pendingOrders, sub: 'Awaiting fulfillment',               icon: CheckCircle,   color: stats.pendingOrders > 0 ? 'bg-orange-500' : 'bg-green-500',     href: '/admin/orders?status=PENDING' },
    { title: 'Total Users',     value: stats.users,        sub: 'Registered customers',                icon: Users,         color: 'bg-teal-500',                                                    href: '/admin/users' },
    { title: 'Revenue',         value: `₹${Math.round(stats.totalRevenue).toLocaleString('en-IN')}`, sub: 'All time', icon: TrendingUp, color: 'bg-emerald-500', href: '/admin/orders' },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Farmers Factory store overview — Farm Fresh + Valluvam Products</p>
      </div>

      {/* ── Inline Product Search ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-neutral-900">🔍 Search Products</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            id="admin-product-search"
            value={query}
            onChange={handleSearchChange}
            placeholder="Type product name to search…"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-10 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search results — shown on same page */}
        {(searching || searched) && (
          <div className="mt-3">
            {searching ? (
              <div className="flex items-center gap-2 py-4 text-sm text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 py-8 text-center">
                <Package className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                <p className="text-sm font-medium text-neutral-500">No products found for &ldquo;{query}&rdquo;</p>
                <Link href="/admin/products/new" className="mt-2 inline-block text-xs font-bold text-primary-600 hover:underline">
                  + Add new product
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-neutral-100">
                <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-4 py-2">
                  <p className="text-xs font-semibold text-neutral-500">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
                  <Link href={`/admin/products?q=${encodeURIComponent(query)}`} className="text-xs font-bold text-primary-600 hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-neutral-50">
                  {results.map((p) => {
                    const img = getFirstImage(p.imageUrls);
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50">
                        {/* thumbnail */}
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                          {img ? (
                            <Image src={img} alt={p.name} fill sizes="40px" className="object-contain p-0.5" />
                          ) : (
                            <Package className="m-auto mt-2.5 h-5 w-5 text-neutral-300" />
                          )}
                        </div>
                        {/* info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-neutral-900 text-sm">{p.name}</p>
                          <p className="text-xs text-neutral-400">{p.category?.name ?? '—'} · {p.unit}</p>
                        </div>
                        {/* price + status */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-neutral-900">₹{p.price}</p>
                          <span className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-[10px] font-bold',
                            p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
                          )}>
                            {p.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        {/* edit link */}
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="ml-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 flex-shrink-0"
                        >
                          Edit
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-neutral-500">{card.title}</p>
                <p className="text-xl font-black text-neutral-900">{card.value}</p>
                <p className="text-xs text-neutral-400">{card.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-neutral-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products/new" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            + Add Product
          </Link>
          <Link href="/admin/banners" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            🖼️ Manage Banners
          </Link>
          <Link href="/" className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            View Store →
          </Link>
        </div>
      </div>

      {/* ── Most Liked / Top Rated Products ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Most Liked Products
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Top products by customer ratings</p>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {topLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
            <Star className="mb-2 h-8 w-8" />
            <p className="text-sm">No rated products yet</p>
            <p className="text-xs mt-1 text-neutral-300">Ratings appear after customers review products</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
            {topProducts.map((p, idx) => {
              const img = getFirstImage(p.imageUrls);
              const rating = p.averageRating ?? 0;
              return (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}/edit`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 transition-shadow hover:shadow-md"
                >
                  {/* Rank badge */}
                  <div className={cn(
                    'absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white shadow',
                    idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-neutral-400' : idx === 2 ? 'bg-amber-600' : 'bg-primary-500',
                  )}>
                    {idx + 1}
                  </div>
                  {/* Image */}
                  <div className="relative h-24 w-full bg-white">
                    {img ? (
                      <Image src={img} alt={p.name} fill sizes="160px" className="object-contain p-2" />
                    ) : (
                      <Package className="m-auto mt-8 h-8 w-8 text-neutral-200" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex flex-col gap-1 p-2">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-neutral-800 group-hover:text-primary-700">
                      {p.name}
                    </p>
                    {rating > 0 ? (
                      <StarRating rating={rating} />
                    ) : (
                      <span className="text-[10px] text-neutral-300">No ratings</span>
                    )}
                    {(p.reviewCount ?? 0) > 0 && (
                      <span className="text-[10px] text-neutral-400">{p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''}</span>
                    )}
                    <p className="text-[11px] font-bold text-neutral-900">₹{p.price}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delivery Minimum Order Setting ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-neutral-900">🚚 Minimum Order Amount</h2>
        <p className="mb-4 text-xs text-neutral-400">
          Customers must reach this cart value before placing an order. Currently: <strong>₹{minOrder}</strong>
        </p>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">₹</span>
            <input
              type="number"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              min={0}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-8 pr-3 text-sm font-bold focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="e.g. 600"
            />
          </div>
          <button
            onClick={() => void saveMinOrder()}
            disabled={minSaving}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {minSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {minSaving ? 'Saving…' : minSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
        {minSaved && <p className="mt-2 text-xs font-semibold text-emerald-600">✓ Minimum order updated to ₹{minOrder}</p>}
      </div>
    </div>
  );
}
