'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

const SHOW_SLUGS = [
  'fruits',
  'vegetables',
  'dry-fruits',
  'nuts',
  'cold-pressed-oils',
  'millets',
  'spices',
  'honey',
  'dairy-ghee',
  'palm-jaggery',
];

const EMOJI: Record<string, string> = {
  'fruits':            '🍎',
  'vegetables':        '🥦',
  'dry-fruits':        '🌰',
  'nuts':              '🥜',
  'cold-pressed-oils': '🫒',
  'millets':           '🌾',
  'spices':            '🌶',
  'honey':             '🍯',
  'dairy-ghee':        '🧈',
  'palm-jaggery':      '🟤',
};

interface CategoryScrollProps {
  activeSlug?: string;
}

export function CategoryScroll({ activeSlug }: CategoryScrollProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d: { data: Category[] }) => {
        const all = d.data ?? [];
        const filtered = SHOW_SLUGS
          .map(s => all.find(c => c.slug === s))
          .filter((c): c is Category => Boolean(c));
        setCategories(filtered);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2 pt-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-neutral-100 shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex flex-wrap gap-2 pb-2 pt-1" role="navigation" aria-label="Shop by category">
      {/* ALL pill */}
      <Link
        href="/"
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors active:scale-95',
          !activeSlug
            ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
            : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:text-primary-700',
        )}
      >
        All Items
      </Link>

      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors active:scale-95',
            activeSlug === cat.slug
              ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
              : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:text-primary-700',
          )}
        >
          <span>{EMOJI[cat.slug] ?? '🛒'}</span>
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
