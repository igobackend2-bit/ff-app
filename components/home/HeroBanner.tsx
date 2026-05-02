import Image from 'next/image';
import Link from 'next/link';

// Hero banner carousel — uses static data in dev; replace with DB fetch in prod
const BANNERS = [
  {
    id: '1',
    title: '🌾 Farm-to-Door in 24 Hours',
    subtitle: 'Fresh fruits, vegetables & daily essentials',
    cta: 'Shop Now',
    href: '/category/fruits-vegetables',
    bg: 'from-primary-600 to-primary-800',
    altText: 'Fresh groceries delivered in 24 hours',
  },
  {
    id: '2',
    title: '🥛 Dairy & Breakfast',
    subtitle: 'Milk, eggs, bread — delivered before you wake up',
    cta: 'Order Now',
    href: '/category/dairy-bread-eggs',
    bg: 'from-blue-500 to-blue-700',
    altText: 'Dairy products and breakfast essentials',
  },
  {
    id: '3',
    title: '🍿 Snacks & Drinks',
    subtitle: 'Party essentials at your door in minutes',
    cta: 'Explore',
    href: '/category/snacks',
    bg: 'from-accent-600 to-accent-800',
    altText: 'Snacks and drinks for every occasion',
  },
];

export function HeroBanner() {
  // In prod: fetch banners from /api/banners with ISR
  // For now, render the first banner statically
  const banner = BANNERS[0]!;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${banner.bg} p-6 text-white md:p-8`}
      role="banner"
      aria-label={banner.altText}
    >
      <div className="relative z-10 max-w-sm">
        <h2 className="text-xl font-bold leading-tight md:text-2xl">{banner.title}</h2>
        <p className="mt-1 text-sm text-white/80">{banner.subtitle}</p>
        <Link
          href={banner.href}
          className="mt-4 inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary-700 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {banner.cta} →
        </Link>
      </div>

      {/* Decorative background element */}
      <div
        className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-10 right-10 h-28 w-28 rounded-full bg-white/10"
        aria-hidden="true"
      />
    </div>
  );
}
