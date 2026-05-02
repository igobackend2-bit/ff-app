import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, LogOut } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Panel | Farmers Factory',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin',          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package,          label: 'Products' },
  { href: '/admin/orders',   icon: ShoppingBag,      label: 'Orders' },
  { href: '/admin/users',    icon: Users,             label: 'Users' },
  { href: '/admin/inventory',icon: BarChart3,         label: 'Inventory' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-neutral-200 bg-white shadow-sm">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b border-neutral-100 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <span className="text-lg font-black text-white">F</span>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">Farmers Factory</p>
            <p className="text-2xs font-medium text-neutral-400">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin navigation">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-100 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="ml-64 flex flex-1 flex-col">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
