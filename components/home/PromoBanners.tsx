'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BannerSlide } from '@/app/api/banners/route';

function PromoCard({ banner }: { banner: BannerSlide }) {
  const hasImage = Boolean(banner.imageUrl);

  return (
    <Link
      href={banner.ctaLink || '/'}
      className="group relative flex min-h-[130px] overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:min-h-[160px]"
    >
      {/* Background gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', banner.bgGradient)} />

      {/* Image overlay */}
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imageUrl}
          alt={banner.headline}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Dark scrim so text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      {/* Text */}
      <div className="relative z-10 flex flex-col justify-end p-3 sm:p-4">
        {banner.title && (
          <span className="mb-1 inline-block w-fit rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {banner.title}
          </span>
        )}
        <p className="text-xs font-black leading-tight text-white sm:text-sm">
          {banner.headline || banner.title}
        </p>
        {banner.subtitle && (
          <p className="mt-0.5 line-clamp-2 text-[10px] text-white/80 sm:text-xs">{banner.subtitle}</p>
        )}
        {banner.ctaText && (
          <span className="mt-2 inline-block w-fit rounded-xl bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-900 shadow-sm transition-opacity group-hover:opacity-90 sm:px-3 sm:text-xs">
            {banner.ctaText}
          </span>
        )}
      </div>
    </Link>
  );
}

export function PromoBanners() {
  const [banners, setBanners] = useState<BannerSlide[]>([]);

  useEffect(() => {
    fetch('/api/banners?position=promo')
      .then((r) => r.json())
      .then((d: { data: BannerSlide[] }) => setBanners(d.data ?? []))
      .catch(() => {});
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="mb-8" aria-label="Promotions">
      <div className={cn(
        'grid gap-3',
        banners.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
      )}>
        {banners.slice(0, 2).map((b) => (
          <PromoCard key={b.id} banner={b} />
        ))}
      </div>
    </section>
  );
}
