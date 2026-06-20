import Link from 'next/link';
import { Zap } from 'lucide-react';

// SEO-rich footer with FSSAI compliance, social links, and trending search links

const FOOTER_LINKS = {
  'Quick Links': [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
  ],
  'Customer Care': [
    { label: 'Help Center', href: '/help' },
    { label: 'Track Order', href: '/account/orders' },
    { label: 'Return Policy', href: '/returns' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'FSSAI License', href: '/fssai' },
  ],
};

const SHOP_CATEGORIES = [
  { label: 'Fruits',             href: '/category/fruits' },
  { label: 'Vegetables',         href: '/category/vegetables' },
  { label: 'Valluvam Products',  href: '/category/valluvam-products' },
  { label: 'Nuts',               href: '/category/nuts' },
  { label: 'Dry Fruits',         href: '/category/dry-fruits' },
  { label: 'Spices',             href: '/category/spices' },
  { label: 'Millets',            href: '/category/millets' },
  { label: 'Oils',               href: '/category/cold-pressed-oils' },
  { label: 'Palm Jaggery',       href: '/category/honey-jaggery' },
  { label: 'Honey',              href: '/category/honey' },
  { label: 'Ghee',               href: '/category/dairy-ghee' },
];

export function Footer() {
  return (
    <footer
      className="border-t border-neutral-200 bg-neutral-50"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-screen-xl px-4 py-10 md:px-6">
        {/* ── Shop Categories ─────────────────────────── */}
        <section aria-labelledby="categories-heading" className="mb-8">
          <h2
            id="categories-heading"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500"
          >
            Shop by Category
          </h2>
          <ul className="flex flex-wrap gap-2" role="list">
            {SHOP_CATEGORIES.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'inline-block rounded-full border border-neutral-200 bg-white',
                    'px-3 py-1 text-xs text-neutral-600',
                    'transition-colors hover:border-primary-300 hover:text-primary-700',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                  ].join(' ')}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Main footer links ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
              aria-label="Farmers Factory homepage"
            >
              <img src="/logo.jpg" alt="Farmers Factory logo" className="h-7 w-auto object-contain" />
              <span className="text-base font-bold text-neutral-900">
                Farmers<span className="text-primary-600"> Factory</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-neutral-600">
              Fresh groceries delivered to your door in 24 hours.
            </p>
            <p className="mt-2 text-xs text-neutral-400">
              Delivering fresh & natural products across Tamil Nadu.
            </p>

            {/* FSSAI Compliance */}
            <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-neutral-500">
                FSSAI Licence No.
              </p>
              <p className="mt-0.5 font-mono text-xs text-neutral-700">
                12426008000403
              </p>
            </div>
          </div>

          {/* Footer link groups */}
          {Object.entries(FOOTER_LINKS).map(([groupName, links]) => (
            <div key={groupName}>
              <h3 className="mb-3 text-sm font-semibold text-neutral-800">
                {groupName}
              </h3>
              <ul className="space-y-2" role="list">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={[
                        'text-sm text-neutral-500',
                        'transition-colors hover:text-neutral-800',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                      ].join(' ')}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Farmers Factory Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p>
            Made with ❤️ in India · CIN: U74999MH2024PTC000001
          </p>
        </div>
      </div>
    </footer>
  );
}
