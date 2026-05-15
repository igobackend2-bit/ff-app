'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, LogOut, Package, UserCircle, ChevronDown, MapPin } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

export function Header() {
  const router   = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted]           = useState(false);
  const [userHydrated, setUserHydrated]   = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const onHydrated = () => {
      setUserHydrated(true);
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        if (!document.cookie.split(';').some((c) => c.trim().startsWith('ff_auth='))) {
          document.cookie = 'ff_auth=1; path=/; max-age=2592000; SameSite=Lax';
        }
      }
    };

    if (useUserStore.persist.hasHydrated()) {
      onHydrated();
    } else {
      const unsub = useUserStore.persist.onFinishHydration(onHydrated);
      return unsub;
    }
    return undefined;
  }, []);

  const handleLogout = useCallback(() => {
    // Clear cookie
    document.cookie = 'ff_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Clear store
    useUserStore.getState().logout();
    // Redirect
    router.push('/');
    setIsDropdownOpen(false);
  }, [router]);

  const totalItems  = useCartStore((s) => s.totalItems());
  const openDrawer  = useCartStore((s) => s.openDrawer);
  const cartCount   = mounted ? totalItems : 0;

  const _address    = useLocationStore((s) => s.address);
  const _city       = useLocationStore((s) => s.city);
  const _etaDisplay = useLocationStore((s) => s.deliveryEta());

  // Guard against SSR/client mismatch — locationStore is persisted to localStorage
  const address    = mounted ? _address    : null;
  const city       = mounted ? _city       : null;
  const etaDisplay = mounted ? _etaDisplay : null;

  const { openLocationModal, openSearch, openAuthModal } = useUIStore();
  const { user, isLoggedIn } = useUserStore();

  // Delayed Login Popup logic
  useEffect(() => {
    if (!mounted || !userHydrated) return;

    // Only show if not logged in and hasn't been shown in this session
    const hasBeenShown = sessionStorage.getItem('ff_auth_modal_shown');
    
    if (!user && !hasBeenShown) {
      const timer = setTimeout(() => {
        // Double check login status before opening
        if (!useUserStore.getState().user) {
          useUIStore.getState().openAuthModal();
          sessionStorage.setItem('ff_auth_modal_shown', 'true');
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [mounted, userHydrated, user]);

  const getInitial = useCallback(() => {
    if (!user?.name) return null;
    return user.name.charAt(0).toUpperCase();
  }, [user]);

  const handleLocationClick = useCallback(() => {
    openLocationModal();
  }, [openLocationModal]);

  return (
    <header
      className="sticky top-0 z-[7500] w-full border-b border-neutral-100 bg-white shadow-sm"
      role="banner"
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-3 px-4 md:gap-4 md:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          aria-label="Farmers Factory — home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <span className="text-lg font-black text-white leading-none">F</span>
          </div>
          <span className="hidden text-base font-black text-neutral-900 sm:block">
            Farmers<span className="text-primary-600">Factory</span>
          </span>
        </Link>

        {/* Location pill */}
        <button
          onClick={handleLocationClick}
          aria-label="Change delivery location"
          className={cn(
            'hidden md:flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2',
            'text-sm text-neutral-600 transition-colors hover:bg-neutral-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
          )}
        >
          <span className="text-primary-600 font-semibold text-xs">
            {etaDisplay ?? '10 min'}
          </span>
          <span className="mx-1 text-neutral-300">|</span>
          <span className="max-w-[140px] truncate text-xs font-medium">
            {address ?? city ?? 'Set location'}
          </span>
        </button>

        {/* Search bar (desktop) */}
        <button
          onClick={openSearch}
          aria-label="Search products"
          className={cn(
            'hidden md:flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5',
            'text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
          )}
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Search for groceries, vegetables, fruits…</span>
        </button>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1">

          {/* Location (mobile only) */}
          <button
            onClick={handleLocationClick}
            aria-label="Change delivery location"
            className={cn(
              'md:hidden',
              'flex h-touch items-center gap-1 rounded-xl px-2',
              'text-neutral-600 transition-colors hover:bg-neutral-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            )}
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
            <span className="max-w-[80px] truncate text-xs font-semibold text-neutral-700">
              {address ?? city ?? 'Location'}
            </span>
          </button>

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
          <div className="relative">
            <button
              onClick={() => {
                if (userHydrated && isLoggedIn()) {
                  setIsDropdownOpen(!isDropdownOpen);
                } else {
                  openAuthModal('/account');
                }
              }}
              aria-label={userHydrated && isLoggedIn() ? 'Toggle account menu' : 'Sign in'}
              className={cn(
                'flex h-touch min-w-touch items-center gap-1.5 rounded-xl px-3',
                'text-sm font-medium text-neutral-600',
                'transition-colors hover:bg-neutral-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                isDropdownOpen && 'bg-neutral-100',
              )}
            >
              {userHydrated && isLoggedIn() && getInitial() ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                  {getInitial()}
                </div>
              ) : (
                <User className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {userHydrated && isLoggedIn() ? (user?.name?.split(' ')[0] || 'Account') : 'Account'}
              </span>
              {userHydrated && isLoggedIn() && (
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isDropdownOpen && "rotate-180")} />
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 z-50 w-56 origin-top-right rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                  <div className="px-3 py-2 border-b border-neutral-50 mb-1">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Account</p>
                    <p className="text-sm font-bold text-neutral-900 truncate">{user?.name || user?.phone || user?.email}</p>
                  </div>
                  
                  <Link
                    href="/account"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-primary-600"
                  >
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </Link>

                  <Link
                    href="/account/orders"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-primary-600"
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>

                  <div className="my-1 border-t border-neutral-50" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Cart */}
          <button
            onClick={openDrawer}
            aria-label={
              cartCount > 0
                ? `Open cart — ${cartCount} item${cartCount > 1 ? 's' : ''}`
                : 'Open cart — empty'
            }
            className={cn(
              'relative flex h-11 items-center gap-1.5 rounded-xl px-3',
              'bg-primary-600 text-white',
              'transition-colors hover:bg-primary-700 active:bg-primary-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
            )}
          >
            <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
            {cartCount > 0 ? (
              <span className="min-w-[18px] rounded-full bg-white px-1 text-[11px] font-black text-primary-600">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            ) : (
              <span className="hidden text-xs font-bold sm:inline">Cart</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
