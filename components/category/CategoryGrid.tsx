import { CategoryCard, CategoryCardSkeleton } from './CategoryCard';
import type { Category } from '@/types';
import { DEMO_CATEGORIES } from '@/lib/demo-data';

async function getCategories(): Promise<Category[]> {
  try {
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? (process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 3600 },
    });
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
      {categories.slice(0, 8).map((cat) => (
        <CategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
