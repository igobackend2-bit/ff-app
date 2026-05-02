// Skill #19: Full Product JSON-LD schema
// Skill #21: BreadcrumbList
// Skill #26: ONE h1 = product name
// Skill #42: Canonical redirect if slug doesn't match product's actual slug

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';
import { ProductJsonLd } from '@/components/seo/ProductJsonLd';
import { BreadcrumbJsonLd, BreadcrumbNav } from '@/components/seo/BreadcrumbJsonLd';
import { AddToCartSection } from '@/components/product/AddToCartSection';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductSection } from '@/components/product/ProductSection';
import { SkeletonGrid } from '@/components/product/SkeletonCard';
import { formatPrice, discountPercent } from '@/lib/utils';

export const revalidate = 300;

interface Params {
  slug: string;
}

async function getProduct(slug: string) {
  try {
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    // API returns { data: product, error: null } — unwrap .data so product.slug is defined
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// Skill #18 — Dynamic metadata with product name (NEVER generic placeholder)
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Product Not Found' };

  const title =
    product.metaTitle ??
    `${product.name} ${product.unit} — Buy at ₹${product.price} | Farmers Factory`;
  const description =
    product.metaDescription ??
    `Buy ${product.name} ${product.unit} online at ₹${product.price}. ${product.description ?? ''} Get delivered within 24 hours.`.slice(0, 155);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://farmersfactory.in/product/${slug}`,
      images: [
        {
          url: product.imageUrls[0],
          width: 800,
          height: 800,
          alt: `${product.name} ${product.unit}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.imageUrls[0]],
    },
    alternates: {
      canonical: `https://farmersfactory.in/product/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  // Skill #42 — Canonical redirect: if URL slug != actual product slug, 301 redirect
  if (product.slug !== slug) {
    redirect(`/product/${product.slug}`);
  }

  const discount = discountPercent(product.mrp, product.price);
  const url = `https://farmersfactory.in/product/${product.slug}`;

  const breadcrumbs = [
    { name: 'Categories', href: '/categories' },
    { name: product.categoryName ?? 'Category', href: `/category/${product.categorySlug ?? ''}` },
    { name: product.name, href: `/product/${product.slug}` },
  ];

  return (
    <>
      {/* Skill #19 — Product JSON-LD (REQUIRED on every PDP) */}
      <ProductJsonLd product={product} url={url} />

      {/* Skill #21 — BreadcrumbList */}
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
        <BreadcrumbNav items={breadcrumbs} />

        <div className="grid gap-8 md:grid-cols-2">
          {/* ── Product images ─────────────────────────────────── */}
          <div className="relative">
            {discount > 0 && (
              <div
                className="absolute left-3 top-3 z-10 rounded-full bg-accent-700 px-3 py-1 text-xs font-bold text-white"
                aria-label={`${discount}% off`}
              >
                {discount}% OFF
              </div>
            )}
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">
              {/* Skill #8: alt = product name + unit */}
              <Image
                src={product.imageUrls[0]}
                alt={`${product.name} ${product.unit}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-4"
                priority // Above the fold — eager load (Skill #34 principle)
                placeholder={product.blurDataUrls?.[0] ? 'blur' : 'empty'}
                blurDataURL={product.blurDataUrls?.[0] ?? undefined}
              />
            </div>
          </div>

          {/* ── Product details ─────────────────────────────────── */}
          <div className="flex flex-col">
            {product.brandName && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {product.brandName}
              </p>
            )}

            {/* Skill #26 — ONE h1: product name */}
            <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>

            <p className="mt-1 text-sm text-neutral-500">{product.unit}</p>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="mt-2 flex items-center gap-2" aria-label={`Rated ${product.averageRating} out of 5 — ${product.reviewCount} reviews`}>
                <div className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1">
                  <span className="text-sm font-bold text-primary-700" aria-hidden="true">★ {product.averageRating}</span>
                </div>
                <span className="text-xs text-neutral-500">{product.reviewCount} reviews</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-neutral-900">
                {formatPrice(product.price)}
              </span>
              {discount > 0 && (
                <span className="text-lg text-neutral-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
              )}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Product tags">
                {product.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                {product.description}
              </p>
            )}

            {/* Add to cart — with sticky mobile CTA */}
            <AddToCartSection product={product} />
          </div>
        </div>

        {/* Reviews */}
        <Suspense fallback={<div className="mt-8 skeleton h-48 rounded-2xl" />}>
          <ProductReviews productId={product.id} />
        </Suspense>

        {/* Similar products */}
        <section aria-labelledby="similar-heading" className="mt-8">
          <h2 id="similar-heading" className="mb-4 text-lg font-bold text-neutral-900">
            Similar Products
          </h2>
          <Suspense fallback={<SkeletonGrid count={4} />}>
            <ProductSection
              categoryId={product.categoryId}
              excludeId={product.id}
              limit={8}
            />
          </Suspense>
        </section>
      </div>
    </>
  );
}
