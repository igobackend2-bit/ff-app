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

const RING_COLOR: Record<string, string> = {
  'fruits':            'border-red-200 bg-red-50',
  'vegetables':        'border-green-200 bg-green-50',
  'dry-fruits':        'border-orange-200 bg-orange-50',
  'nuts':              'border-yellow-200 bg-yellow-50',
  'cold-pressed-oils': 'border-yellow-300 bg-yellow-50',
  'millets':           'border-lime-200 bg-lime-50',
  'spices':            'border-red-300 bg-red-50',
  'honey':             'border-yellow-300 bg-yellow-50',
  'dairy-ghee':        'border-amber-100 bg-amber-50',
  'palm-jaggery':      'border-amber-300 bg-amber-50',
};

function CategoryCircle({ cat, isActive }: { cat: Category; isActive: boolean }) {
  const [imgError, setImgError] = useState(false);
  const emoji     = EMOJI[cat.slug] ?? '🛒';
  const ringColor = RING_COLOR[cat.slug] ?? 'border-neutral-100 bg-white';

  return (
    <Link
      href={`/category/${cat.slug}`}
      className="flex shrink-0 flex-col items-center gap-1.5 transition-all active:scale-95"
    >
      <div className={cn(
        'relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl border-2 shadow-sm transition-all',
        isActive
          ? 'border-primary-500 bg-primary-50 scale-110 shadow-primary-100'
          : `${ringColor} hover:scale-105 hover:shadow-md`,
      )}>
        {cat.imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cat.imageUrl}
            alt={cat.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-3xl select-none" role="img" aria-label={cat.name}>{emoji}</span>
        )}
        {isActive && (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-primary-500 ring-offset-1" />
        )}
      </div>
      <span className={cn(
        'w-[68px] text-center text-[10px] font-bold leading-tight',
        isActive ? 'text-primary-700' : 'text-neutral-600',
      )}>
        {cat.name}
      </span>
    </Link>
  );
}

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
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-3 pt-2">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="h-[68px] w-[68px] animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-2.5 w-12 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-3 pt-2" role="navigation" aria-label="Shop by category">
      {/* ALL pill */}
      <Link
        href="/"
        className="flex shrink-0 flex-col items-center gap-1.5 transition-all active:scale-95"
      >
        <div className={cn(
          'flex h-[68px] w-[68px] items-center justify-center rounded-2xl border-2 shadow-sm transition-all',
          !activeSlug
            ? 'border-primary-500 bg-primary-600 scale-110 shadow-primary-200'
            : 'border-neutral-100 bg-white hover:scale-105 hover:shadow-md',
        )}>
          <span className={cn('text-xs font-black', !activeSlug ? 'text-white' : 'text-neutral-500')}>ALL</span>
        </div>
        <span className={cn(
          'w-[68px] text-center text-[10px] font-bold leading-tight',
          !activeSlug ? 'text-primary-700' : 'text-neutral-600',
        )}>
          All Items
        </span>
      </Link>

      {categories.map((cat) => (
        <CategoryCircle key={cat.id} cat={cat} isActive={activeSlug === cat.slug} />
      ))}
    </div>
  );
}
