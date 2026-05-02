// Skill #15: Category page with dynamic metadata and OG image
// Skill #21: BreadcrumbList JSON-LD
// Skill #22: Category name used in meta title (not generic placeholder)
// Skill #9: Skeleton loaders via Suspense

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BreadcrumbJsonLd, BreadcrumbNav } from '@/components/seo/BreadcrumbJsonLd';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CategoryFilters } from '@/components/category/CategoryFilters';
import { SkeletonGrid } from '@/components/product/SkeletonCard';

// Revalidate every 5 minutes
export const revalidate = 300;

interface Params {
  slug: string;
}

interface SearchParams {
  sort?: string;
  brand?: string;
  tags?: string;
  page?: string;
}

// ── Fetch category data ────────────────────────────────────────────────────────
async function getCategory(slug: string) {
  try {
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/categories/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// ── Skill #18: Dynamic metadata using actual category name ────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  // Skill #22: category.name in title — NOT a generic placeholder
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
      // Skill #24: OG image required on category pages
      images: [
        {
          url: category.ogImageUrl ?? category.imageUrl,
          width: 1200,
          height: 630,
          alt: `${category.name} — Farmers Factory`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [category.ogImageUrl ?? category.imageUrl],
    },
    alternates: {
      canonical: `https://farmersfactory.in/category/${slug}`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { sort = 'relevance', brand, tags, page = '1' } = await searchParams;

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Categories', href: '/categories' },
    { name: category.name, href: `/category/${slug}` },
  ];

  return (
    <>
      {/* Skill #21 — BreadcrumbList JSON-LD */}
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
        {/* Breadcrumb UI */}
        <BreadcrumbNav items={breadcrumbs} />

        {/* Skill #26 — ONE h1 per page: category name */}
        <h1 className="mb-0.5 text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mb-6 text-sm font-medium text-neutral-500">{category.description}</p>
        )}

        <div className="flex gap-6">
          {/* Sidebar filters (desktop) */}
          <aside
            className="hidden w-64 shrink-0 md:block"
            aria-label="Product filters"
          >
            <div className="sticky top-24 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
              <CategoryFilters
                categoryId={category.id}
                currentSort={sort}
                currentBrand={brand}
                currentTags={tags}
              />
            </div>
          </aside>

          {/* Product grid */}
          <div className="min-w-0 flex-1">
            {/* Mobile filters */}
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
