'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { useUserStore } from '@/store/userStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAddressStore } from '@/store/addressStore';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, MapPin, ChevronRight, Gift, ArrowLeft,
  LogOut, ShieldCheck, Heart, Headset,
  Package, PackageCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocation } from '@/hooks/useLocation';
import { AddressCard } from '@/components/account/AddressCard';

function AccountSkeleton() {
  return (
    <div className="min-h-screen bg-[#F2F3F7] pb-24 animate-pulse">
      <div className="sticky top-0 z-30 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-screen-md items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-neutral-100" />
          <div className="h-6 w-24 rounded-lg bg-neutral-100" />
        </div>
      </div>
      <div className="mx-auto max-w-screen-md px-4 py-5 space-y-4">
        <div className="h-28 rounded-2xl bg-white shadow-sm" />
        <div className="h-5 w-36 rounded bg-neutral-200" />
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-neutral-50 last:border-0">
              <div className="h-10 w-10 rounded-xl bg-neutral-100 shrink-0" />
              <div className="h-4 w-36 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router        = useRouter();
  const user          = useUserStore((s) => s.user);
  const logout        = useUserStore((s) => s.logout);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const wishlist      = useWishlistStore((s) => s.items);
  const wishlistItems = wishlist.slice(0, 3);
  const location      = useLocation();

  const [hydrated,      setHydrated]      = useState(false);
  const [orderCount,    setOrderCount]    = useState<number | null>(null);
  const [recentOrders,  setRecentOrders]  = useState<{
    id: string; orderNumber: string; status: string; total: number; createdAt: string;
  }[]>([]);

  useEffect(() => {
    if (useUserStore.persist.hasHydrated()) { setHydrated(true); return; }
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !user) { router.replace('/login?callbackUrl=/account'); return; }
    if (hydrated && user) {
      // Send x-user-id so the server can detect stale-JWT mismatches
      fetch('/api/orders', { headers: { 'x-user-id': user.id } })
        .then((r) => r.json())
        .then((d: { data?: { id: string; orderNumber: string; status: string; total: number; createdAt: string }[] }) => {
          const orders = d.data ?? [];
          setOrderCount(orders.length);
          setRecentOrders(orders.slice(0, 3));
        })
        .catch(() => { setOrderCount(0); setRecentOrders([]); });
    }
  }, [hydrated, user, router]);

  const handleLogout = async () => {
    // Clear all client-side stores first
    useWishlistStore.getState().clearWishlist();
    useCartStore.getState().clearCart();
    useAddressStore.getState().clearAddress();
    logout();
    document.cookie = 'ff_auth=; path=/; max-age=0; SameSite=Lax';
    // Sign out from NextAuth — this clears the authjs.session-token JWT cookie
    // so subsequent API calls (like /api/orders) don't see the old user's session
    await signOut({ redirect: false });
    router.push('/');
  };

  if (!hydrated || !user) return <AccountSkeleton />;

  const initials = user.name
    ? user.name.trim().split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'PICKING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const STATUS_LABEL: Record<string, string> = {
    PLACED: 'Order Placed', CONFIRMED: 'Confirmed', PICKING: 'Picking',
    OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  };
  const STEP_ICON: Record<string, string> = {
    PLACED: '📦', CONFIRMED: '✅', PICKING: '🛒',
    OUT_FOR_DELIVERY: '🚚', DELIVERED: '🎉', CANCELLED: '❌',
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32">

      {/* ── Gradient Header ── */}
      <div className="relative h-48 overflow-hidden bg-emerald-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.8),transparent)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize: '24px 24px' }}
        />
        <div className="relative z-10 mx-auto flex max-w-screen-md items-center justify-between px-4 pt-8">
          <button
            onClick={() => router.push('/')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-md">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-white/80" />
            <span className="max-w-[140px] truncate text-xs font-bold text-white/90">
              {location.loading ? 'Locating...' : location.error ? 'Location off' : (location.city || location.address || 'Unknown')}
            </span>
          </div>

          <button
            onClick={() => void handleLogout()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-red-500/50 active:scale-90"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-20 max-w-screen-md space-y-6 px-4">

        {/* ── Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-900/5 ring-1 ring-neutral-100"
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white shadow-lg ring-4 ring-emerald-50">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-100 bg-white text-emerald-600 shadow-sm">
                <Gift className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-black text-neutral-900">{user.name || 'Set your name'}</h2>
              <p className="mt-0.5 truncate text-sm font-semibold italic text-neutral-500">{user.phone || user.email}</p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                  <ShieldCheck className="h-3 w-3" /> Verified Member
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-neutral-50 pt-6">
            <div className="flex flex-col items-center border-r border-neutral-50">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">Loyalty Points</p>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Gift className="h-4 w-4" />
                <span className="text-lg font-black">{user.loyaltyPoints ?? 0}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">Your Orders</p>
              <div className="flex items-center gap-1.5 text-orange-500">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-lg font-black">{orderCount === null ? '...' : orderCount}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Orders',  icon: ShoppingBag, href: '/account/orders',    color: 'text-orange-500', bg: 'bg-orange-50'  },
            { label: 'Wishlist',icon: Heart,        href: '/account/wishlist',  color: 'text-pink-500',   bg: 'bg-pink-50'    },
            { label: 'Address', icon: MapPin,       href: '/account/addresses', color: 'text-blue-500',   bg: 'bg-blue-50'    },
            { label: 'Support', icon: Headset,      href: '/support',           color: 'text-emerald-500',bg: 'bg-emerald-50' },
          ].map((item, idx) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
              <Link href={item.href} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 transition-all hover:shadow-md active:scale-95">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', item.bg)}>
                  <item.icon className={cn('h-6 w-6', item.color)} />
                </div>
                <span className="text-[11px] font-black text-neutral-700">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── My Orders Banner ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Link href="/account/orders" className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 transition-colors hover:bg-orange-100 active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-neutral-900">My Orders</p>
                <p className="text-xs font-medium text-orange-600">Track &amp; view all your orders</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-orange-400" />
          </Link>
        </motion.div>

        {/* ── Delivery Address ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
          <h3 className="mb-2 px-1 text-sm font-black uppercase tracking-widest text-neutral-400">Delivery Address</h3>
          <AddressCard />
        </motion.div>

        {/* ── Recent Orders with green stepper ── */}
        {recentOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100"
          >
            <div className="flex items-center justify-between border-b border-neutral-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-black text-neutral-900">Recent Orders</span>
              </div>
              <Link href="/account/orders" className="text-xs font-black uppercase tracking-wider text-primary-600 hover:text-primary-700">
                View All
              </Link>
            </div>
            <div className="divide-y divide-neutral-50">
              {recentOrders.map((order) => {
                const isCancelled = order.status === 'CANCELLED';
                const currentIdx  = ORDER_STEPS.indexOf(order.status);
                const progressPct = isCancelled ? 0 : Math.round(((currentIdx + 1) / ORDER_STEPS.length) * 100);

                return (
                  <Link key={order.id} href={`/account/orders/${order.id}`}
                    className="block px-5 py-4 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
                  >
                    {/* Order info row */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                          <Package className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-800">#{order.orderNumber}</p>
                          <p className="text-xs text-neutral-400">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-neutral-900">Rs.{order.total?.toFixed(0)}</span>
                    </div>

                    {/* Status stepper */}
                    {isCancelled ? (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
                        <span className="text-sm">❌</span>
                        <span className="text-xs font-bold text-red-600">Order Cancelled</span>
                      </div>
                    ) : (
                      <div>
                        <div className="relative flex items-center justify-between">
                          {/* Track line — grey base */}
                          <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-100" />
                          {/* Track line — green progress */}
                          <div
                            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: progressPct + '%' }}
                          />
                          {ORDER_STEPS.map((step, idx) => {
                            const done    = currentIdx >= 0 && idx <= currentIdx;
                            const current = idx === currentIdx;
                            return (
                              <div key={step} className="relative z-10">
                                <div className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-full border-2 text-[8px] font-black transition-all',
                                  done
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-neutral-200 bg-white text-neutral-300',
                                  current ? 'ring-2 ring-emerald-200 ring-offset-1' : '',
                                )}>
                                  {done ? 'V' : String(idx + 1)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-xs">{STEP_ICON[order.status] ?? '📦'}</span>
                          <span className="text-xs font-bold text-emerald-700">
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Wishlist Preview ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100"
        >
          <div className="flex items-center justify-between border-b border-neutral-50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              <span className="text-sm font-black text-neutral-900">My Wishlist</span>
              {wishlistCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600">{wishlistCount}</span>
              )}
            </div>
            <Link href="/account/wishlist" className="text-xs font-black uppercase tracking-wider text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>

          {wishlistCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Heart className="h-8 w-8 text-neutral-200" />
              <p className="text-sm font-medium text-neutral-400">No saved items yet</p>
              <Link href="/" className="text-xs font-bold text-primary-600 underline underline-offset-4">Browse products</Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {wishlistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {item.imageUrls?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrls[0]} alt={item.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-neutral-800">{item.name}</p>
                    <p className="text-xs text-neutral-400">{item.unit}</p>
                  </div>
                  <span className="text-sm font-black text-neutral-900">Rs.{item.price}</span>
                </div>
              ))}
              {wishlistCount > 3 && (
                <Link href="/account/wishlist" className="flex items-center justify-center gap-1 py-3 text-xs font-bold text-neutral-400 transition-colors hover:text-primary-600">
                  +{wishlistCount - 3} more items
                </Link>
              )}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
