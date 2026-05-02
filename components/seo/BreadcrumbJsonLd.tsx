// Skill #21 — BreadcrumbList JSON-LD
// Used on category pages and product detail pages

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://farmersfactory.in';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ── Breadcrumb UI component ──────────────────────────────────────────────────
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BreadcrumbNav({ items }: BreadcrumbJsonLdProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol
        className="flex flex-wrap items-center gap-1 text-xs text-neutral-500"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <li
          itemScope
          itemType="https://schema.org/ListItem"
          itemProp="itemListElement"
        >
          <Link
            href="/"
            itemProp="item"
            aria-label="Home"
            className={cn(
              'flex items-center gap-0.5 hover:text-primary-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            )}
          >
            <Home className="h-3 w-3" aria-hidden="true" />
            <meta itemProp="position" content="1" />
          </Link>
        </li>

        {items.map((item, index) => (
          <li
            key={item.href}
            className="flex items-center gap-1"
            itemScope
            itemType="https://schema.org/ListItem"
            itemProp="itemListElement"
          >
            <ChevronRight className="h-3 w-3 text-neutral-300" aria-hidden="true" />
            {index === items.length - 1 ? (
              <span
                itemProp="name"
                aria-current="page"
                className="font-medium text-neutral-700"
              >
                {item.name}
                <meta itemProp="position" content={String(index + 2)} />
              </span>
            ) : (
              <Link
                href={item.href}
                itemProp="item"
                className={cn(
                  'hover:text-primary-600',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                )}
              >
                <span itemProp="name">{item.name}</span>
                <meta itemProp="position" content={String(index + 2)} />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
