'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryScrollProps {
  activeSlug?: string;
}

export function CategoryScroll({ activeSlug }: CategoryScrollProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="no-scrollbar flex gap-6 overflow-x-auto pb-6 pt-4">
      {isLoading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-3">
            <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
          </div>
        ))
      ) : (
        <>
          <Link
            href="/"
            className={cn(
              "flex shrink-0 flex-col items-center gap-3 transition-all active:scale-95",
              !activeSlug ? "opacity-100" : "opacity-70 hover:opacity-100"
            )}
          >
            <div className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-sm transition-all",
              !activeSlug 
                ? "border-primary-600 bg-primary-50 text-primary-600 scale-105" 
                : "border-transparent bg-neutral-50 text-neutral-400"
            )}>
              <span className="text-sm font-black">ALL</span>
            </div>
            <span className={cn(
              "text-xs font-extrabold tracking-tight",
              !activeSlug ? "text-primary-900" : "text-neutral-600"
            )}>
              All Items
            </span>
          </Link>

          {categories.slice(0, 10).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={cn(
                "flex shrink-0 flex-col items-center gap-3 transition-all active:scale-95",
                activeSlug === cat.slug ? "opacity-100" : "opacity-70 hover:opacity-100"
              )}
            >
              <div className={cn(
                "relative h-20 w-20 overflow-hidden rounded-full border-2 shadow-sm transition-all",
                activeSlug === cat.slug 
                  ? "border-primary-600 bg-primary-50 scale-105" 
                  : "border-transparent bg-neutral-50 hover:border-neutral-200"
              )}>
                {cat.imageUrl && (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="80px"
                    className="object-contain p-3"
                  />
                )}
              </div>
              <span className={cn(
                "max-w-[84px] text-center text-xs font-extrabold leading-tight tracking-tight",
                activeSlug === cat.slug ? "text-primary-900" : "text-neutral-600"
              )}>
                {cat.name}
              </span>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
