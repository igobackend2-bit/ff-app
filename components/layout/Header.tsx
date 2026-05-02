'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ShoppingCart, User, ChevronDown, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  // ── Hydration guard ──────────────────────────────────────────────────────
  // Cart state lives in localStorage (Zustand persist). During SSR the store
  // has 0 items; after client rehydration it may have items. Reading totalItems()
  // directly on both server and client produces mismatched aria-label and badge
  // span, triggering React's hydration error. We delay reading cart state until
  // after the component has mounted on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const totalItems = useCartStore((s) => s.totalItems());
  const openDrawer = useCartStore((s) => s.openDrawer);
  // Always 0 during SSR/first-paint; real value after mount
  const cartCount = mounted ? totalItems : 0;
  const address = useLocationStore((s) => s.address);
  const city = useLocationStore((s) => s.city);
  const etaDisplay = useLocationStore((s) => s.deliveryEta());
  const { openLocationModal, openSearch, openAuthModal } = useUIStore();
  const { isLoggedIn } = useUserStore();

  const handleLocationClick = useCallback(() => {
    openLocationModal();
  }, [openLocationModal]);

  return (
    <header
      className="sticky top-0 z-[6000] w-full border-b border-neutral-100 bg-white shadow-sm"
      role="banner"
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-3 px-4 md:gap-4 md:px-6">
        {/* ── Logo ──────────────────────────────────────────────── */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label="Farmers Factory — Go to homepage"
        >
          <Image
            src="/logo.jpg"
            alt="Farmers Factory"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
          />
          <span className="text-lg font-bold text-neutral-900 sm:text-xl">
            Farmers<span className="text-primary-600"> Factory</span>
          </span>
        </Link>

        {/* ── Delivery location ─────────────────────────────────── */}
        <button
          onClick={handleLocationClick}
          aria-label={
            address
              ? `Delivering to ${address}. Click to change location.`
              : 'Set your delivery location'
          }
          className={cn(
            'flex min-h-touch min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1',
            'text-left transition-colors hover:bg-neutral-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            'md:max-w-xs',
          )}
        >
          <MapPin
            className={cn(
              'h-4 w-4 shrink-0',
              address ? 'text-primary-600' : 'text-neutral-400',
            )}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            {address ? (
              <>
                <div className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 fill-accent-500 text-accent-500" aria-hidden="true" />
                  <span className="text-xs font-bold text-primary-700">
                    {etaDisplay}
                  </span>
                  <ChevronDown className="h-3 w-3 text-neutral-400" aria-hidden="true" />
                </div>
                <p className="truncate text-xs text-neutral-600">
                  {city ?? address}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-neutral-600">
                  Set location
                </span>
                <ChevronDown className="h-3 w-3 text-neutral-400" aria-hidden="true" />
              </div>
            )}
          </div>
        </button>

        {/* ── Search bar (desktop) ──────────────────────────────── */}
        <button
          onClick={openSearch}
          aria-label="Open search"
          className={cn(
            'hidden md:flex',
            'flex-1 items-center gap-2 rounded-xl',
            'border border-neutral-200 bg-neutral-50',
            'px-4 py-2.5',
            'text-sm text-neutral-500',
            'transition-colors hover:border-primary-300 hover:bg-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            'max-w-sm',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
          <span>Search for groceries…</span>
        </button>

        {/* ── Right actions ─────────────────────────────────────── */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Search (mobile) */}
          <button
            onClick={openSearch}
            aria-label="Open search"
            className={cn(
              'md:hidden',
              'flex h-touch w-touch items-center justify-center rounded-xl',
              'text-neutral-600 transition-colors hover:bg-neutral-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            )}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Account */}
          <button
            onClick={() => {
              if (isLoggedIn()) {
                router.push('/account/profile');
              } else {
                openAuthModal();
              }
            }}
            aria-label="Sign in or view account"
            className={cn(
              'hidden sm:flex',
              'h-touch min-w-touch items-center gap-1.5 rounded-xl px-3',
              'text-sm font-medium text-neutral-600',
              'transition-colors hover:bg-neutral-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            )}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            <span>Account</span>
          </button>

          {/* Cart */}
          <button
            onClick={openDrawer}
            aria-label={
              cartCount > 0
                ? `Open cart — ${cartCount} item${cartCount > 1 ? 's' : ''}`
                : 'Open cart — empty'
            }
            className={cn(
              'relative flex h-touch w-touch items-center justify-center rounded-xl',
              'bg-primary-600 text-white',
              'transition-colors hover:bg-primary-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
            )}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span
                aria-hidden="true" // count is already in aria-label above
                className={cn(
                  'absolute -right-1 -top-1',
                  'flex h-5 w-5 items-center justify-center rounded-full',
                  'bg-accent-500 text-white',
                  'text-2xs font-bold',
                  'motion-safe:animate-bounce-once',
                )}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
