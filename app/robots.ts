import type { MetadataRoute } from 'next';

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://farmersfactory.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/category/', '/product/', '/search'],
        disallow: [
          '/account/',
          '/checkout/',
          '/api/',
          '/_next/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
