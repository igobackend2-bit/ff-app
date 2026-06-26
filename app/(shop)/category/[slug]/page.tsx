import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BreadcrumbJsonLd, BreadcrumbNav } from '@/components/seo/BreadcrumbJsonLd';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CategoryFilters } from '@/components/category/CategoryFilters';
import { SkeletonGrid } from '@/components/product/SkeletonCard';

export const revalidate = 300;

interface Params      { slug: string }
interface SearchParams { sort?: string; brand?: string; tags?: string; page?: string }

async function getCategory(slug: string) {
  // Read directly from the data layer — avoids an internal HTTP fetch to a
  // deployment URL that is behind Vercel's SSO protection wall.
  try {
    // Hardcoded extra categories (Meat & Seafood, Nuts, Dry Fruits, etc.)
    const { getExtraCategories } = await import('@/lib/extra-products');
    const extra = getExtraCategories().find((c) => c.slug === slug);
    if (extra) return extra;

    const { db } = await import('@/lib/supabase');
    const { localizeImageUrl, cleanCategoryName } = await import('@/lib/clean-name');
    const r = (await db.getCategoryBySlug(slug)) as any;
    if (!r) return null;
    return {
      id:          r.id,
      name:        cleanCategoryName(r.name, slug),
      slug,
      description: r.description ?? null,
      imageUrl:    r.image_url ? localizeImageUrl(r.image_url) : (r.image_url ?? ''),
      iconUrl:     null,
      parentId:    null,
      sortOrder:   r.sort_order ?? 0,
      metaTitle:   null,
      metaDescription: null,
      _count:      { products: 0 },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug) as {
    name: string; metaTitle?: string | null; metaDescription?: string | null;
    imageUrl?: string; ogImageUrl?: string | null; _count?: { products: number };
  } | null;

  if (!category) return { title: 'Category Not Found' };

  const title = category.metaTitle ?? `${category.name} — Buy Online at Best Prices | Farmers Factory`;
  const description =
    category.metaDescription ??
    `Order ${category.name.toLowerCase()} online. Fresh products delivered within 24 hours. Shop from ${category._count?.products ?? 'hundreds of'} products.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://farmersfactory.in/category/${slug}`,
      images: [{ url: category.ogImageUrl ?? category.imageUrl ?? '', width: 1200, height: 630, alt: `${category.name} — Farmers Factory` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [category.ogImageUrl ?? category.imageUrl ?? ''] },
    alternates: { canonical: `https://farmersfactory.in/category/${slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { sort = 'relevance', brand, tags, page = '1' } = await searchParams;

  const category = await getCategory(slug) as {
    id: string; name: string; slug: string; description?: string | null;
  } | null;

  if (!category) notFound();

  const breadcrumbs = [
    { name: 'Categories', href: '/categories' },
    { name: category.name, href: `/category/${slug}` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
        <BreadcrumbNav items={breadcrumbs} />

        <h1 className="mb-0.5 text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mb-6 text-sm font-medium text-neutral-500">{category.description}</p>
        )}

        <div className="flex gap-6">
          <aside className="hidden w-64 shrink-0 md:block" aria-label="Product filters">
            <div className="sticky top-24 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
              <CategoryFilters
                categoryId={category.id}
                currentSort={sort}
                currentBrand={brand}
                currentTags={tags}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 md:hidden">
              <CategoryFilters
                categoryId={category.id}
                currentSort={sort}
                currentBrand={brand}
                currentTags={tags}
                mobile
              />
            </div>

            <Suspense fallback={<SkeletonGrid count={12} />}>
              <ProductGrid
                categoryId={category.id}
                categorySlug={slug}
                sort={sort}
                brand={brand}
                tags={tags}
                page={parseInt(page, 10)}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
