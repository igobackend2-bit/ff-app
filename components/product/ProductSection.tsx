import Link from 'next/link';
import { headers } from 'next/headers';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

export interface ProductSectionProps {
  title?: string;
  subtitle?: string;
  filter?: 'featured';
  sort?: 'orders' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
  categorySlug?: string;
  categoryId?: string | number;
  excludeId?: string | number;
  limit?: number;
  priority?: boolean;
}

async function fetchProducts(props: ProductSectionProps): Promise<Product[]> {
  try {
    // Always hit THIS deployment's own API — derive the origin from the incoming
    // request headers. (A stale NEXT_PUBLIC_APP_URL like localhost:3001 used to
    // make this fetch fail, which silently showed hard-coded demo products.)
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const baseUrl = host
      ? `${proto}://${host}`
      : (process.env['NEXT_PUBLIC_APP_URL']?.startsWith('https')
          ? process.env['NEXT_PUBLIC_APP_URL']
          : 'https://ff-app-ten.vercel.app');

    const params = new URLSearchParams();
    if (props.categorySlug) params.set('category', props.categorySlug);
    if (props.categoryId) params.set('categoryId', String(props.categoryId));
    if (props.filter === 'featured') params.set('filter', 'featured');
    if (props.sort) params.set('sort', props.sort);
    params.set('limit', String(props.limit ?? 8));

    const res = await fetch(`${baseUrl}/api/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: { data: Product[] } | null };
    let products = json.data?.data ?? [];
    if (props.excludeId) products = products.filter((p) => String(p.id) !== String(props.excludeId));
    return products.slice(0, props.limit ?? 8);
  } catch {
    return [];
  }
}

export async function ProductSection(props: ProductSectionProps) {
  const { title, subtitle, categorySlug, priority = false } = props;
  const products = await fetchProducts(props);

  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby={title ? `section-${title.replace(/\W+/g, '-')}` : undefined}
      className="mb-8"
    >
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2
              id={`section-${title.replace(/\W+/g, '-')}`}
              className="text-lg font-extrabold tracking-tight text-neutral-900 md:text-xl"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs font-medium text-neutral-500 md:text-sm">{subtitle}</p>
            )}
          </div>
          {categorySlug && (
            <Link
              href={`/category/${categorySlug}`}
              className="flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            >
              See all <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}


      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={priority && i < 2}
          />
        ))}
      </div>
    </section>
  );
}
