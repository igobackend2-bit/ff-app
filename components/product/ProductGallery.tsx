'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  imageUrls: string[];
  blurDataUrls?: string[];
  productName: string;
  productUnit: string;
  discount?: number;
}

function isVideo(url: string) {
  const u = url.toLowerCase();
  return (
    u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.ogg') ||
    u.endsWith('.mov') || u.includes('/videos/')
  );
}

function isYoutube(url: string) {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/');
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m?.[1] ?? null;
}

export function ProductGallery({ imageUrls, blurDataUrls, productName, productUnit, discount }: Props) {
  const [selected, setSelected] = useState(0);

  const media = imageUrls.length > 0 ? imageUrls : ['/images/placeholder.png'];
  const current = media[selected] ?? media[0] ?? '';
  const isCurrentVideo = isVideo(current);
  const isCurrentYoutube = isYoutube(current);

  const prev = () => setSelected((i) => (i - 1 + media.length) % media.length);
  const next = () => setSelected((i) => (i + 1) % media.length);

  return (
    <div className="flex flex-col gap-3">
      {/* Main viewer */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">
        {/* Discount badge */}
        {(discount ?? 0) > 0 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-accent-700 px-3 py-1 text-xs font-bold text-white">
            {discount}% OFF
          </div>
        )}

        {isCurrentYoutube ? (
          <iframe
            src={`https://www.youtube.com/embed/${getYoutubeId(current)}?autoplay=0&rel=0`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isCurrentVideo ? (
          <video
            key={current}
            src={current}
            controls
            playsInline
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <Image
            src={current}
            alt={`${productName} ${productUnit}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-4"
            priority
            placeholder={blurDataUrls?.[selected] ? 'blur' : 'empty'}
            blurDataURL={blurDataUrls?.[selected] ?? undefined}
          />
        )}

        {/* Prev / Next arrows — only if more than 1 media */}
        {media.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow hover:bg-white"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4 text-neutral-700" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row — only shown if 2+ media */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((url, idx) => {
            const vid = isVideo(url);
            const yt = isYoutube(url);
            const ytId = yt ? getYoutubeId(url) : null;
            return (
              <button
                key={idx}
                onClick={() => setSelected(idx)}
                className={cn(
                  'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                  idx === selected
                    ? 'border-primary-500 shadow-md'
                    : 'border-neutral-200 opacity-70 hover:opacity-100',
                )}
              >
                {yt && ytId ? (
                  // YouTube thumbnail
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={`Video ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : vid ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-purple-50">
                    <Play className="h-5 w-5 text-purple-500" />
                    <span className="text-[9px] font-bold text-purple-500">VIDEO</span>
                  </div>
                ) : (
                  <Image
                    src={url}
                    alt={`${productName} ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
