'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname      = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const totalItems    = useCartStore((s) => s.totalItems());
  const openDrawer    = useCartStore((s) => s.openDrawer);
  const wishlistCount = useWishlistStore((s) => s.count());
  const cartCount     = mounted ? totalItems : 0;
  const wCount        = mounted ? wishlistCount : 0;

  // Static nav tabs (no cart — cart is a special button)
  const NAV_ITEMS = [
    { href: '/',                   label: 'Home',     icon: Home          },
    { href: '/wishlist',           label: 'Wishlist', icon: Heart,  badge: wCount },
    { href: '/account/orders',     label: 'Orders',   icon: ClipboardList },
    { href: '/account/profile',    label: 'Profile',  icon: User          },
  ] as const;

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[5000]',
        'border-t border-neutral-200 bg-white',
        'pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]',
        'md:hidden',
      )}
    >
      <ul className="flex items-stretch" role="list">
        {/* Home */}
        {NAV_ITEMS.slice(0, 1).map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-touch flex-col items-center justify-center gap-0.5 px-1 py-2',
                  'text-xs font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
                  isActive ? 'text-primary-700' : 'text-neutral-400 hover:text-neutral-600',
                )}
              >
                <Icon
                  className={cn('h-5 w-5', isActive ? 'text-primary-600' : 'text-neutral-400')}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}

        {/* Wishlist */}
        <li className="flex-1">
          <Link
            href="/wishlist"
            aria-current={pathname === '/wishlist' ? 'page' : undefined}
            className={cn(
              'relative flex min-h-touch flex-col items-center justify-center gap-0.5 px-1 py-2',
              'text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
              pathname === '/wishlist' ? 'text-red-600' : 'text-neutral-400 hover:text-neutral-600',
            )}
          >
            <span className="relative">
              <Heart
                className={cn(
                  'h-5 w-5',
                  pathname === '/wishlist' ? 'fill-red-500 stroke-red-500' : 'stroke-neutral-400',
                )}
                strokeWidth={2}
                aria-hidden="true"
              />
              {wCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
                >
                  {wCount > 9 ? '9+' : wCount}
                </span>
              )}
            </span>
            <span>Wishlist</span>
          </Link>
        </li>

        {/* Cart — centre prominent button */}
        <li className="flex-1">
          <button
            onClick={openDrawer}
            aria-label={cartCount > 0 ? `Cart — ${cartCount} item${cartCount > 1 ? 's' : ''}` : 'Cart — empty'}
            className={cn(
              'relative flex min-h-touch w-full flex-col items-center justify-center gap-0.5 px-1 py-2',
              'text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
              cartCount > 0 ? 'text-primary-700' : 'text-neutral-400 hover:text-neutral-600',
            )}
          >
            <span className="relative">
              <ShoppingCart
                className={cn('h-5 w-5', cartCount > 0 ? 'text-primary-600' : 'text-neutral-400')}
                strokeWidth={cartCount > 0 ? 2.5 : 2}
                aria-hidden="true"
              />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold text-white"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
            <span>Cart</span>
          </button>
        </li>

        {/* Orders */}
        <li className="flex-1">
          <Link
            href="/account/orders"
            aria-current={pathname.startsWith('/account/orders') ? 'page' : undefined}
            className={cn(
              'relative flex min-h-touch flex-col items-center justify-center gap-0.5 px-1 py-2',
              'text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
              pathname.startsWith('/account/orders') ? 'text-primary-700' : 'text-neutral-400 hover:text-neutral-600',
            )}
          >
            <ClipboardList
              className={cn(
                'h-5 w-5',
                pathname.startsWith('/account/orders') ? 'text-primary-600' : 'text-neutral-400',
              )}
              strokeWidth={pathname.startsWith('/account/orders') ? 2.5 : 2}
              aria-hidden="true"
            />
            <span>Orders</span>
          </Link>
        </li>

        {/* Profile */}
        <li className="flex-1">
          <Link
            href="/account/profile"
            aria-current={pathname.startsWith('/account/profile') ? 'page' : undefined}
            className={cn(
              'relative flex min-h-touch flex-col items-center justify-center gap-0.5 px-1 py-2',
              'text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600',
              pathname.startsWith('/account/profile') ? 'text-primary-700' : 'text-neutral-400 hover:text-neutral-600',
            )}
          >
            <User
              className={cn(
                'h-5 w-5',
                pathname.startsWith('/account/profile') ? 'text-primary-600' : 'text-neutral-400',
              )}
              strokeWidth={pathname.startsWith('/account/profile') ? 2.5 : 2}
              aria-hidden="true"
            />
            <span>Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
