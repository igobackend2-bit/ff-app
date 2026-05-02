// Skill #19 — Full Product JSON-LD schema
// Required on every Product Detail Page (PDP)

import type { Product } from '@/types';

interface ProductJsonLdProps {
  product: Product;
  url: string;
}

export function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: product.name,
    description: product.description ?? undefined,
    image: product.imageUrls,
    sku: product.sku,
    brand: product.brandName
      ? {
          '@type': 'Brand',
          name: product.brandName,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: product.price.toString(),
      priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Farmers Factory',
        url: 'https://farmersfactory.in',
      },
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
