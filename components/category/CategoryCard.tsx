import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

// ── CategoryCard ─────────────────────────────────────────────────────────────
// Skill #8: uses next/image with descriptive alt text
// Skill #25: text uses neutral-800 (14.7:1 vs white bg) ✅

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        'group flex flex-col items-center gap-2 rounded-2xl p-3',
        'bg-white/80 backdrop-blur-md border border-white/50 shadow-sm',
        'transition-all duration-300 hover:bg-white hover:border-primary-200 hover:shadow-lg hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1',
      )}
      aria-label={`Browse ${category.name} — ${category._count?.products ?? 'many'} products`}
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-gradient-to-br from-primary-50 to-white p-2 border border-primary-50/50 transition-colors group-hover:from-primary-100 group-hover:to-white">
        <Image
          src={category.imageUrl}
          alt={`${category.name} category`}
          fill
          sizes="56px"
          className="object-contain p-1 transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      <span className="line-clamp-2 text-center text-[11px] font-bold tracking-tight text-neutral-800 group-hover:text-primary-700 transition-colors">
        {category.name}
      </span>
    </Link>
  );
}

// ── Skeleton variant ──────────────────────────────────────────────────────────
export function CategoryCardSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-100 bg-white p-3"
      aria-hidden="true"
      role="presentation"
    >
      <div className="skeleton h-14 w-14 rounded-xl" />
      <div className="skeleton h-3 w-12 rounded" />
    </div>
  );
}
