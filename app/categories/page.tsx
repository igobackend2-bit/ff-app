'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Category } from '@/types';

const SHOW_SLUGS = [
  'fruits',
  'vegetables',
  'valluvam',
  'dry-fruits',
  'nuts',
  'spices',
  'cold-pressed-oils',
  'millets',
  'dairy-ghee',
  'honey',
  'seeds-health-mix',
];

const EMOJI: Record<string, string> = {
  'fruits':            '\u{1F34E}',
  'vegetables':        '\u{1F966}',
  'valluvam':          '\u{1FAD9}',
  'dry-fruits':        '\u{1F330}',
  'nuts':              '\u{1F95C}',
  'spices':            '\u{1F336}️',
  'cold-pressed-oils': '\u{1FAD2}',
  'millets':           '\u{1F33E}',
  'dairy-ghee':        '\u{1F9C8}',
  'honey':             '\u{1F36F}',
  'seeds-health-mix':  '\u{1F331}',
};

const BG: Record<string, string> = {
  'fruits':            'from-red-50 to-pink-50 border-red-100',
  'vegetables':        'from-green-50 to-emerald-50 border-green-100',
  'valluvam':          'from-amber-50 to-yellow-50 border-amber-100',
  'dry-fruits':        'from-orange-50 to-amber-50 border-orange-100',
  'nuts':              'from-yellow-50 to-orange-50 border-yellow-100',
  'spices':            'from-red-50 to-orange-50 border-red-100',
  'cold-pressed-oils': 'from-yellow-50 to-lime-50 border-yellow-100',
  'millets':           'from-lime-50 to-green-50 border-lime-100',
  'dairy-ghee':        'from-amber-50 to-yellow-50 border-amber-100',
  'honey':             'from-yellow-50 to-amber-50 border-yellow-100',
  'seeds-health-mix':  'from-teal-50 to-green-50 border-teal-100',
};

type CatWithCount = Category & { _count?: { products: number } };

function CategoryCard({ cat, index }: { cat: CatWithCount; index: number }) {
  const [imgError, setImgError] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 55);
    return () => clearTimeout(t);
  }, [index]);

  const emoji = EMOJI[cat.slug] ?? '\u{1F6D2}';
  const bg = BG[cat.slug] ?? 'from-neutral-50 to-white border-neutral-100';

  return (
    <Link
      href={`/category/${cat.slug}`}
      className={`group relative flex flex-col items-center gap-3 rounded-3xl border bg-gradient-to-br p-5 shadow-sm hover:shadow-xl active:scale-95 ${bg}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
        transition: `opacity 0.4s ease ${index * 40}ms, transform 0.4s ease ${index * 40}ms, box-shadow 0.2s`,
      }}
    >
      <div className="relative h-[76px] w-[76px] overflow-hidden rounded-2xl bg-white shadow ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-110">
        {cat.imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cat.imageUrl}
            alt={cat.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl select-none" role="img" aria-label={cat.name}>{emoji}</span>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-[13px] font-black leading-snug text-neutral-800 group-hover:text-primary-700 transition-colors">
          {cat.name}
        </p>
        {cat._count !== undefined && (
          <p className="mt-0.5 text-[11px] font-medium text-neutral-400">
            {cat._count.products} items
          </p>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-primary-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CatWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d: { data: CatWithCount[] }) => {
        const all = d.data ?? [];
        const filtered = SHOW_SLUGS
          .map(s => all.find(c => c.slug === s))
          .filter((c): c is CatWithCount => Boolean(c));
        setCategories(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-white">
      <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white/90 backdrop-blur-md px-4 py-4 text-center shadow-sm">
        <h1 className="text-xl font-black text-neutral-900">Shop by Category</h1>
        <p className="mt-0.5 text-xs text-neutral-400">Fresh, organic &amp; traditional products</p>
      </div>

      <div className="mx-auto max-w-screen-sm px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 rounded-3xl border border-neutral-100 bg-white p-5">
                <div className="h-[76px] w-[76px] animate-pulse rounded-2xl bg-neutral-100" />
                <div className="h-3 w-14 animate-pulse rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
