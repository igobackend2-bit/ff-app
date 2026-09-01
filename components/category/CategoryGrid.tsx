import { headers } from 'next/headers';
import { CategoryCard, CategoryCardSkeleton } from './CategoryCard';
import type { Category } from '@/types';
import { DEMO_CATEGORIES } from '@/lib/demo-data';

async function getCategories(): Promise<Category[]> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const baseUrl = host
      ? `${proto}://${host}`
      : (process.env['NEXT_PUBLIC_APP_URL']?.startsWith('https')
          ? process.env['NEXT_PUBLIC_APP_URL']
          : 'https://ff-app-ten.vercel.app');

    const res = await fetch(`${baseUrl}/api/categories`, { cache: 'no-store' });
    if (!res.ok) return DEMO_CATEGORIES;
    const data = (await res.json()) as { data: Category[] };
    return data.data?.length ? data.data : DEMO_CATEGORIES;
  } catch {
    return DEMO_CATEGORIES;
  }
}

export async function CategoryGrid() {
  const categories = await getCategories();

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
