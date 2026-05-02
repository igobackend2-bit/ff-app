// Admin Dashboard — uses Supabase via /api/admin/stats
import type { Metadata } from 'next';
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard | Admin' };
export const revalidate = 30;

async function getStats() {
  try {
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/stats`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('stats failed');
    const json = (await res.json()) as { data: Record<string, number> };
    return json.data ?? {};
  } catch {
    return { products: 20, outOfStock: 0, inStock: 20, orders: 0, pendingOrders: 0, users: 0, totalRevenue: 0, recentOrders: 0 };
  }
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:          'bg-yellow-100 text-yellow-700',
  CONFIRMED:        'bg-blue-100 text-blue-700',
  PICKING:          'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED:        'bg-green-100 text-green-700',
  CANCELLED:        'bg-red-100 text-red-700',
};

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { title: 'Total Products',  value: stats['products'] ?? 0,      sub: `${stats['inStock'] ?? 0} in stock`,      icon: Package,       color: 'bg-blue-500',                                           href: '/admin/products' },
    { title: 'Out of Stock',    value: stats['outOfStock'] ?? 0,    sub: 'Need restocking',                         icon: AlertTriangle, color: (stats['outOfStock'] ?? 0) > 0 ? 'bg-red-500' : 'bg-green-500',  href: '/admin/products?stock=out' },
    { title: 'Total Orders',    value: stats['orders'] ?? 0,        sub: `${stats['recentOrders'] ?? 0} this week`, icon: ShoppingBag,   color: 'bg-violet-500',                                         href: '/admin/orders' },
    { title: 'Pending Orders',  value: stats['pendingOrders'] ?? 0, sub: 'Awaiting fulfillment',                    icon: CheckCircle,   color: (stats['pendingOrders'] ?? 0) > 0 ? 'bg-orange-500' : 'bg-green-500', href: '/admin/orders?status=PENDING' },
    { title: 'Total Users',     value: stats['users'] ?? 0,         sub: 'Registered customers',                   icon: Users,         color: 'bg-teal-500',                                           href: '/admin/users' },
    { title: 'Revenue',         value: `₹${Math.round(Number(stats['totalRevenue'] ?? 0)).toLocaleString('en-IN')}`, sub: 'All time', icon: TrendingUp, color: 'bg-emerald-500', href: '/admin/orders' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Farmers Factory store overview — Farm Fresh + Valluvam Products
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${card.color}`}>
              <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-neutral-500">{card.title}</p>
              <p className="text-xl font-black text-neutral-900">{card.value}</p>
              <p className="text-xs text-neutral-400">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-bold text-neutral-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products/new" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            + Add Product
          </Link>
          <Link href="/" className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
            View Store →
          </Link>
        </div>
      </div>
    </div>
  );
}
