// Skill #9 — Shimmer skeleton loader for product cards
// Used in all product grids while data is loading (Skill #51)

import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-neutral-100 bg-white',
        className,
      )}
      aria-hidden="true" // Hidden from screen readers — decorative placeholder
      role="presentation"
    >
      {/* Image placeholder */}
      <div className="aspect-square skeleton" />

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Brand */}
        <div className="skeleton h-2.5 w-1/3 rounded" />
        {/* Name */}
        <div className="skeleton h-3 w-4/5 rounded" />
        {/* Unit */}
        <div className="skeleton h-2.5 w-1/4 rounded" />
        {/* Price row */}
        <div className="flex items-center justify-between pt-1">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    // aria-label tells screen readers this is a loading state
    <div
      role="status"
      aria-label="Loading products…"
      aria-busy="true"
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      {/* Screen reader announcement */}
      <span className="sr-only">Loading products, please wait…</span>
    </div>
  );
}
