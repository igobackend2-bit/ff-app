// Skill #23 — Auto-generated XML sitemap
// Includes all category and product URLs
// Excludes /account/, /checkout/, /api/

import type { MetadataRoute } from 'next';

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://farmersfactory.in';

async function getCategories() {
  try {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: Array<{ slug: string; updatedAt?: string }> };
    return data.data ?? [];
  } catch {
    return [];
  }
}

async function getProducts() {
  try {
    // Fetch all active products for sitemap
    const res = await fetch(`${BASE_URL}/api/products?limit=1000&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data: { data: Array<{ slug: string; updatedAt?: string }> };
    };
    return data.data?.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
