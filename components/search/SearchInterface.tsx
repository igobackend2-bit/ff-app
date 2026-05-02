'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonGrid } from '@/components/product/SkeletonCard';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

const RECENT_KEY = 'qc-recent-searches';

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch { return []; }
}

function saveRecent(q: string) {
  try {
    const prev = getRecent().filter((s) => s !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
  } catch { /* ignore */ }
}

export function SearchInterface({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => { setRecent(getRecent()); }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=24`);
      const data = (await res.json()) as { data: { data: Product[] } };
      setResults(data.data?.data ?? []);
      saveRecent(q);
    } catch { setResults([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void search(query); }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecent(query.trim());
      router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div>
      {/* Search input */}
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="search-input" className="sr-only">Search for groceries</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for groceries, brands…"
            autoFocus
            className={cn(
              'h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-11 pr-10 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {/* Recent searches */}
      {!query && recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="mt-6">
          <h2 id="recent-heading" className="mb-2 text-sm font-semibold text-neutral-700">Recent Searches</h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              >
                <Clock className="h-3 w-3 text-neutral-400" aria-hidden="true" />
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <div className="mt-6" aria-live="polite" aria-atomic="false">
        {isLoading && <SkeletonGrid count={12} />}

        {!isLoading && query && results.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-neutral-700">No results for &ldquo;{query}&rdquo;</p>
            <p className="mt-1 text-sm text-neutral-500">Try a different search term or browse categories.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
