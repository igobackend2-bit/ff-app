'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Play, ChevronLeft, ChevronRight, X, ZoomIn, Film } from 'lucide-react';
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
  return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.ogg') ||
    u.endsWith('.mov') || u.includes('/videos/');
}

function isYoutube(url: string) {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/');
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m?.[1] ?? null;
}

/* ─── Lightbox Popup ──────────────────────────────────────────────── */
function Lightbox({
  media, index, onClose, onPrev, onNext,
}: {
  media: string[]; index: number; onClose: () => void;
  onPrev: () => void; onNext: () => void;
}) {
  const url     = media[index] ?? '';
  const isVid   = isVideo(url);
  const isYT    = isYoutube(url);
  const ytId    = isYT ? getYoutubeId(url) : null;

  // Close on Escape, navigate with arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {media.length > 1 && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1 text-xs font-semibold text-white">
          {index + 1} / {media.length}
        </div>
      )}

      {/* Prev */}
      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Main content */}
      <div
        className="relative mx-16 flex max-h-[85vh] max-w-4xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isYT && ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            className="h-[70vh] w-[80vw] max-w-3xl rounded-2xl"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : isVid ? (
          <video
            key={url}
            src={url}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] max-w-full rounded-2xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Product"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
        )}
      </div>

      {/* Next */}
      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Thumbnail strip at bottom */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2 backdrop-blur">
          {media.map((u, i) => {
            const v = isVideo(u);
            const yt = isYoutube(u);
            const yId = yt ? getYoutubeId(u) : null;
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); /* set index outside */ }}
                onClickCapture={(e) => { e.stopPropagation(); }}
                className={cn(
                  'relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  i === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100',
                )}
              >
                {yt && yId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`https://img.youtube.com/vi/${yId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                ) : v ? (
                  <div className="flex h-full w-full items-center justify-center bg-purple-900">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Gallery Component ──────────────────────────────────────── */
export function ProductGallery({ imageUrls, blurDataUrls, productName, productUnit, discount }: Props) {
  const [selected, setSelected]       = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const media   = imageUrls.length > 0 ? imageUrls : ['/images/placeholder.png'];
  const current = media[selected] ?? '';
  const isVid   = isVideo(current);
  const isYT    = isYoutube(current);
  const ytId    = isYT ? getYoutubeId(current) : null;

  const prev = useCallback(() => setSelected((i) => (i - 1 + media.length) % media.length), [media.length]);
  const next = useCallback(() => setSelected((i) => (i + 1) % media.length), [media.length]);

  return (
    <>
      {/* ── Gallery ── */}
      <div className="flex flex-col gap-3">

        {/* Thumbnail column (left) + Main viewer — Amazon-style layout */}
        <div className="flex gap-3">

          {/* Left thumbnail strip — visible only when 2+ media */}
          {media.length > 1 && (
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 420 }}>
              {media.map((url, idx) => {
                const vid = isVideo(url);
                const yt  = isYoutube(url);
                const yId = yt ? getYoutubeId(url) : null;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(idx)}
                    className={cn(
                      'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                      idx === selected
                        ? 'border-primary-500 shadow-md'
                        : 'border-neutral-200 opacity-60 hover:opacity-100 hover:border-neutral-400',
                    )}
                  >
                    {yt && yId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://img.youtube.com/vi/${yId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                    ) : vid ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-purple-50">
                        <Film className="h-5 w-5 text-purple-500" />
                        <span className="text-[8px] font-bold text-purple-600">VIDEO</span>
                      </div>
                    ) : (
                      <Image src={url} alt="" fill sizes="64px" className="object-contain p-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Main viewer */}
          <div className="relative flex-1">
            {/* Discount badge */}
            {(discount ?? 0) > 0 && (
              <div className="absolute left-3 top-3 z-10 rounded-full bg-accent-700 px-3 py-1 text-xs font-bold text-white">
                {discount}% OFF
              </div>
            )}

            {/* Clickable main image area */}
            <div
              className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50"
              onClick={() => setLightboxOpen(true)}
            >
              {isYT && ytId ? (
                <div className="relative h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt="Video thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 shadow-xl backdrop-blur">
                      <Play className="h-7 w-7 translate-x-0.5 text-white" fill="white" />
                    </div>
                  </div>
                </div>
              ) : isVid ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-900">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 shadow-xl">
                    <Play className="h-9 w-9 translate-x-0.5 text-white" fill="white" />
                  </div>
                  <p className="text-sm font-semibold text-white/80">Click to play video</p>
                </div>
              ) : (
                <Image
                  src={current}
                  alt={`${productName} ${productUnit}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  priority
                  placeholder={blurDataUrls?.[selected] ? 'blur' : 'empty'}
                  blurDataURL={blurDataUrls?.[selected] ?? undefined}
                />
              )}

              {/* Zoom hint overlay */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5 text-white" />
                <span className="text-[11px] font-semibold text-white">View full</span>
              </div>
            </div>

            {/* Prev / Next arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-neutral-100"
                >
                  <ChevronLeft className="h-4 w-4 text-neutral-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-neutral-100"
                >
                  <ChevronRight className="h-4 w-4 text-neutral-700" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dot indicators for mobile */}
        {media.length > 1 && (
          <div className="flex justify-center gap-1.5 md:hidden">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === selected ? 'w-5 bg-primary-600' : 'w-1.5 bg-neutral-300',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox popup ── */}
      {lightboxOpen && (
        <Lightbox
          media={media}
          index={selected}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setSelected((i) => (i - 1 + media.length) % media.length)}
          onNext={() => setSelected((i) => (i + 1) % media.length)}
        />
      )}
    </>
  );
}
