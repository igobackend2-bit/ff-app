import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { CategoryScroll } from '@/components/category/CategoryScroll';
import { ProductSection } from '@/components/product/ProductSection';
import { HeroSlider } from '@/components/home/HeroSlider';
import { PromoBanners } from '@/components/home/PromoBanners';
import { DeliveryStrip } from '@/components/home/DeliveryStrip';
import { SkeletonGrid } from '@/components/product/SkeletonCard';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Farmers Factory — Fresh Farm Products in 24 Hours',
  description:
    'Order fresh fruits, vegetables, dairy, cold-pressed oils and daily essentials. Get 24-hour farm-to-door delivery in Chennai, Bangalore, Mumbai and more cities.',
  openGraph: {
    title: 'Farmers Factory — Fresh Farm Products in 24 Hours',
    description:
      'Farm-fresh groceries delivered to your door in 24 hours. Organic vegetables, traditional products & daily essentials direct from Karnataka farms.',
    url: 'https://farmersfactory.in',
    images: [{ url: '/og/home.jpg', width: 1200, height: 630, alt: 'Farmers Factory — Shop groceries, get farm-fresh delivery in 24 hours' }],
  },
  alternates: { canonical: 'https://farmersfactory.in' },
};

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />

      {/* 24hr Delivery Strip */}
      <DeliveryStrip />

      <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
        <h1 className="sr-only">Shop Groceries Delivered in 24 Hours — Farmers Factory</h1>

        {/* Hero Slider */}
        <section aria-label="Featured promotions" className="mb-6">
          <HeroSlider />
        </section>

        {/* Category Scroll */}
        <section aria-labelledby="categories-heading" className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="categories-heading" className="text-lg font-extrabold tracking-tight text-neutral-900 md:text-xl">
              Shop by Category
            </h2>
          </div>
          <Suspense fallback={
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex shrink-0 flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-full bg-neutral-100" />
                  <div className="h-2 w-12 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          }>
            <CategoryScroll />
          </Suspense>
        </section>

        {/* Promo Banners */}
        <PromoBanners />

        {/* Flash Deals */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="⚡ Super Sale"
            subtitle="Massive savings for you"
            filter="featured"
            limit={6}
            priority
          />
        </Suspense>

        {/* Farm Fresh Vegetables */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🥦 Farm Fresh Vegetables"
            subtitle="Harvested daily, delivered tomorrow"
            categorySlug="vegetables"
            limit={8}
          />
        </Suspense>

        {/* Fresh Fruits */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🍎 Fresh Fruits"
            subtitle="Straight from the orchards"
            categorySlug="fruits"
            limit={8}
          />
        </Suspense>

        {/* Valluvam Products */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🏺 Valluvam Products"
            subtitle="Authentic traditional products — honey, ghee, jaggery & oils"
            categorySlug="valluvam"
            limit={8}
          />
        </Suspense>

        {/* Cold-Pressed Oils */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🫙 Cold-Pressed Oils"
            subtitle="Traditional wooden churner extraction"
            categorySlug="cold-pressed-oils"
            limit={6}
          />
        </Suspense>

        {/* Dairy & Ghee */}
        <Suspense fallback={<SkeletonGrid count={4} />}>
          <ProductSection
            title="🧈 Dairy & Ghee"
            subtitle="Pure buffalo ghee & cow ghee"
            categorySlug="dairy-ghee"
            limit={4}
          />
        </Suspense>

        {/* Honey */}
        <Suspense fallback={<SkeletonGrid count={4} />}>
          <ProductSection
            title="🍯 Honey"
            subtitle="Raw natural honey, no added sugar"
            categorySlug="honey"
            limit={4}
          />
        </Suspense>

        {/* Millets */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🌾 Millets"
            subtitle="Barnyard, foxtail, pearl & more ancient grains"
            categorySlug="millets"
            limit={8}
          />
        </Suspense>

        {/* Spices & Masala */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🌶️ Spices & Masala"
            subtitle="Pure hand-ground spices straight from the source"
            categorySlug="spices"
            limit={8}
          />
        </Suspense>

        {/* Dry Fruits */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🌰 Dry Fruits"
            subtitle="Dates, figs, raisins & more"
            categorySlug="dry-fruits"
            limit={6}
          />
        </Suspense>

        {/* Nuts & Seeds */}
        <Suspense fallback={<SkeletonGrid count={6} />}>
          <ProductSection
            title="🥜 Nuts & Seeds"
            subtitle="Cashews, pista, chia, flax & more"
            categorySlug="nuts"
            limit={6}
          />
        </Suspense>
      </div>
    </>
  );
}
