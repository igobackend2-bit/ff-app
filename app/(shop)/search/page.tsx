'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchInterface } from '@/components/search/SearchInterface';
import { SkeletonGrid } from '@/components/product/SkeletonCard';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">Search</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Find your favorite groceries from Farmers Factory
        </p>
      </div>

      <SearchInterface initialQuery={query} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-100" />
        <div className="mt-8">
          <SkeletonGrid count={12} />
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
