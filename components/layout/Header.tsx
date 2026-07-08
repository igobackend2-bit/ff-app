'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, LogOut, Package, UserCircle, ChevronDown, MapPin, Bell } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useLocationStore } from '@/store/locationStore';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

interface UserNotif {
  id: string; type: string; title: string; message: string;
  orderId: string | null; isRead: boolean; createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function typeIcon(type: string): string {
  if (type === 'ORDER_STATUS')  return '📦';
  if (type === 'ORDER_PLACED')  return '🛒';
  if (type === 'PROMO')         return '🎉';
  return 'ℹ️';
}

export function Header() {
  const router   = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted]               = useState(false);
  const [userHydrated, setUserHydrated]     = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);
  const [notifs, setNotifs]                 = useState<UserNotif[]>([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const notifRef                            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const onHydrated = () => {
      setUserHydrated(true);
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        if (!document.cookie.split(';').some((c) => c.trim().startsWith('ff_auth='))) {
          document.cookie = 'ff_auth=1; path=/; max-age=2592000; SameSite=Lax';
        }
        // Ensure cart & wishlist belong to this user (clears stale data from another user)
        useCartStore.getState().initForUser(currentUser.id);
        useWishlistStore.getState().initForUser(currentUser.id);
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
    // Clear user-specific stores so the next user starts fresh
    useCartStore.getState().clearCart();
    useWishlistStore.getState().clearWishlist();
    // Clear user store
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

  // localStorage key for dismissed notification IDs
  const DISMISSED_KEY = 'ff_dismissed_notifs';

  const getDismissed = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]') as string[]); }
    catch { return new Set(); }
  };

  const saveDismissed = (ids: Set<string>) => {
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
  };

  // Fetch user notifications, filtering out dismissed ones
  useEffect(() => {
    if (!mounted || !userHydrated) return;
    if (!isLoggedIn()) return;

    const fetchNotifs = () => {
      fetch('/api/notifications/user')
        .then((r) => r.json())
        .then((d: { notifications: UserNotif[]; unreadCount: number }) => {
          const dismissed = getDismissed();
          const visible = (d.notifications ?? []).filter((n) => !dismissed.has(n.id));
          setNotifs(visible);
          setUnreadCount(visible.filter((n) => !n.isRead).length);
        })
        .catch(() => null);
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(timer);
  }, [mounted, userHydrated, isLoggedIn]);

  const openNotifications = () => {
    setNotifOpen(true);
    // Mark all visible as read in state
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    fetch('/api/notifications/user/mark-read', { method: 'POST' }).catch(() => null);
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    fetch('/api/notifications/user/mark-read', { method: 'POST' }).catch(() => null);
  };

  const dismissNotif = (id: string) => {
    setNotifs((prev) => {
      const next = prev.filter((n) => n.id !== id);
      setUnreadCount(next.filter((n) => !n.isRead).length);
      return next;
    });
    const dismissed = getDismissed();
    dismissed.add(id);
    saveDismissed(dismissed);
  };

  const clearAll = () => {
    const dismissed = getDismissed();
    notifs.forEach((n) => dismissed.add(n.id));
    saveDismissed(dismissed);
    setNotifs([]);
    setUnreadCount(0);
  };

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
          <Image
            src="/logo.jpg"
            alt="Farmers Factory"
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
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

                  <div className="my-1 border-t border-neutral-100" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          {mounted && userHydrated && isLoggedIn() && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => notifOpen ? setNotifOpen(false) : openNotifications()}
                aria-label="Notifications"
                className={cn(
                  'flex h-touch w-touch items-center justify-center rounded-xl',
                  'text-neutral-600 transition-colors hover:bg-neutral-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                  notifOpen && 'bg-neutral-100',
                )}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 z-50 w-80 origin-top-right rounded-2xl border border-neutral-100 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between border-b border-neutral-50 px-4 py-3">
                      <p className="text-sm font-bold text-neutral-900">Notifications</p>
                      <div className="flex items-center gap-2">
                        {notifs.some((n) => !n.isRead) && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] font-semibold text-primary-600 hover:text-primary-700"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifs.length > 0 && (
                          <button
                            onClick={clearAll}
                            className="text-[11px] font-semibold text-red-500 hover:text-red-600"
                          >
                            Clear all
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} className="text-neutral-400 hover:text-neutral-600 ml-1">
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-neutral-400">
                          <Bell className="mx-auto mb-2 h-6 w-6 opacity-30" />
                          No notifications yet
                        </div>
                      ) : (
                        notifs.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              'flex gap-3 px-4 py-3 border-b border-neutral-50 last:border-0',
                              !n.isRead && 'bg-primary-50/60',
                            )}
                          >
                            <span className="mt-0.5 text-base shrink-0">{typeIcon(n.type)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-neutral-900 leading-snug">{n.title}</p>
                              <p className="text-xs text-neutral-500 leading-snug mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                            <button
                              onClick={() => dismissNotif(n.id)}
                              className="shrink-0 mt-0.5 text-neutral-300 hover:text-neutral-500 text-xs leading-none"
                              aria-label="Dismiss notification"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cart button */}
          <button
            onClick={openDrawer}
            aria-label={`Shopping cart, ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
            className={cn(
              'relative flex h-touch min-w-touch items-center justify-center gap-1.5 rounded-xl px-3',
              'text-sm font-medium text-neutral-600',
              'transition-colors hover:bg-neutral-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            )}
          >
            <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
            {mounted && cartCount > 0 && (
              <span
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[11px] font-black text-white ring-2 ring-white"
                aria-hidden="true"
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
