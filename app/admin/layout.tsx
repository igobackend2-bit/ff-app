'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, LogOut, Store, MapPin, Navigation, Image as ImageIcon, Bell, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';

const NAV: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; badge?: boolean }[] = [
  { href: '/admin',                      icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/admin/products',             icon: Package,          label: 'Products'      },
  { href: '/admin/orders',               icon: ShoppingBag,      label: 'Orders'        },
  { href: '/admin/banners',              icon: ImageIcon,        label: 'Banners & Ads' },
  { href: '/admin/users',                icon: Users,            label: 'Users'         },
  { href: '/admin/inventory',            icon: BarChart3,        label: 'Inventory'     },
  { href: '/admin/notifications',        icon: Bell,             label: 'Notifications', badge: true },
  { href: '/admin/products/bulk-upload', icon: Upload,           label: 'Bulk Upload'   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const location = useLocation();
  const [sessionOk, setSessionOk]       = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    // Login page renders itself — no auth check needed
    if (pathname === '/admin/login') {
      setSessionOk(true);
      return;
    }
    fetch('/api/admin/me', { credentials: 'include' })
      .then((r) => {
        if (r.ok) {
          setSessionOk(true);
        } else {
          router.replace('/admin/login');
        }
      })
      .catch(() => router.replace('/admin/login'));
  }, [pathname, router]);

  // Poll unread notification count every 30 s
  useEffect(() => {
    if (!sessionOk || pathname === '/admin/login') return;
    const poll = () => {
      fetch('/api/admin/notifications?limit=1')
        .then((r) => r.json())
        .then((d: { unreadCount?: number }) => setUnreadNotifs(d.unreadCount ?? 0))
        .catch(() => null);
    };
    poll();
    const timer = setInterval(poll, 30_000);
    return () => clearInterval(timer);
  }, [sessionOk, pathname]);

  const handleLogout = () => {
    void fetch('/api/admin/login', { method: 'DELETE' }).finally(() => {
      router.push('/admin/login');
    });
  };

  // Blank screen while checking session (no flash of admin UI)
  if (!sessionOk) return null;

  // Login page gets no sidebar wrapper
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-neutral-200 bg-white shadow-sm">

        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-neutral-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
            <span className="text-xl font-black text-white">F</span>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 leading-tight">Farmers Factory</p>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>

        {/* GPS Location card */}
        <div className="mx-3 mt-3 rounded-xl border border-neutral-100 bg-primary-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            {location.loading
              ? <Navigation className="h-3.5 w-3.5 animate-pulse text-primary-500" />
              : <MapPin className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-400">
                {location.loading ? 'Detecting...' : 'Current Location'}
              </p>
              <p className="truncate text-xs font-bold text-primary-700">
                {location.loading
                  ? '--'
                  : location.error
                  ? 'Location unavailable'
                  : (location.address || (location.lat ? location.lat.toFixed(4) + ', ' + location.lng.toFixed(4) : 'Unknown'))}
              </p>
              {!location.loading && !location.error && location.city && (
                <p className="text-[10px] text-primary-500">
                  {location.city}{location.state ? ', ' + location.state : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 mt-2" aria-label="Admin navigation">
          {NAV.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            const showBadge = badge && unreadNotifs > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-700',
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                </div>
                {label}
                {showBadge && (
                  <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-3 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 transition-colors"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-60 flex flex-1 flex-col min-h-screen">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
