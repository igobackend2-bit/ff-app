'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { SkeletonGrid } from './SkeletonCard';
import type { Product } from '@/types';

interface ProductGridProps {
  categoryId:   string;
  categorySlug?: string;
  sort?:  string;
  brand?: string;
  tags?:  string;
  page?:  number;
}

export function ProductGrid({ categoryId, categorySlug, sort, brand, tags, page = 1 }: ProductGridProps) {
  const [products, setProducts]   = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ limit: '100', page: String(page) });

        // Filter by category slug — required so only this category's products show
        const slug = categorySlug ?? categoryId;
        if (slug) params.set('category', slug);

        if (sort && sort !== 'relevance') params.set('sort', sort);
        if (brand) params.set('brand', brand);
        if (tags)  params.set('tags', tags);

        const res = await fetch(`/api/products?${params}`);
        if (!res.ok) throw new Error('Failed');
        const data = (await res.json()) as { data: { data: Product[] } };
        let loaded = data.data?.data ?? [];

        // Fallback: if category is empty, try related parent category
        if (loaded.length === 0 && slug) {
          const fallbackMap: Record<string, string> = {
            'cold-pressed-oils': 'oils-ghee',
            'honey':             'honey-jaggery',
            'dairy-ghee':        'honey-jaggery',
          };
          const fallbackSlug = fallbackMap[slug];
          if (fallbackSlug) {
            const fb = new URLSearchParams({ limit: '100', page: String(page), category: fallbackSlug });
            if (sort && sort !== 'relevance') fb.set('sort', sort);
            const fbRes = await fetch(`/api/products?${fb}`);
            if (fbRes.ok) {
              const fbData = (await fbRes.json()) as { data: { data: Product[] } };
              // For dairy-ghee fallback, only show ghee products (filter from honey-jaggery)
              const fbProducts = fbData.data?.data ?? [];
              if (slug === 'dairy-ghee') {
                loaded = fbProducts.filter(p => p.name.toLowerCase().includes('ghee'));
              } else if (slug === 'honey') {
                loaded = fbProducts.filter(p => p.name.toLowerCase().includes('honey') || p.name.toLowerCase().includes('jaggery') || p.name.toLowerCase().includes('palm'));
              } else {
                loaded = fbProducts;
              }
            }
          }
        }
        setProducts(loaded);
      } catch {
        setError('Could not load products.');
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [categoryId, categorySlug, sort, brand, tags, page]);

  if (isLoading) return <SkeletonGrid count={12} />;

  if (error) return (
    <div role="alert" className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600">
      {error}
    </div>
  );

  if (products.length === 0) return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
      <p className="text-neutral-500">No products found in this category yet.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
