import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

// ââ Environment validation at build time âââââââââââââââââââââââââââââââââââââ
// These MUST be present in production. Build will throw if missing.
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXTAUTH_SECRET',
] as const;

if (process.env['NODE_ENV'] === 'production' && process.env['SKIP_ENV_VALIDATION'] !== 'true') {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      throw new Error(
        `[Farmers Factory] Missing required environment variable at build time: ${key}\n` +
          `Add it to your .env.local or Vercel dashboard.`,
      );
    }
  }
}

// ââ Security headers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(self), camera=(self), microphone=(self), payment=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Content Security Policy
    // Nonce-based CSP is recommended for production â update as you add third-party domains
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://vitals.vercel-insights.com https://*.supabase.co",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // ââ Image optimisation ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  images: {
    formats: ['image/avif', 'image/webp'], // AVIF first (best compression)
    deviceSizes: [400, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      // Unsplash â demo product images (reliable, never 404)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Supabase Storage â product images uploaded via admin
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Flaticon â category/product icons
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        pathname: '/**',
      },
      // Freepik CDN (related icon host)
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.freepik.com',
        pathname: '/**',
      },
      // Allow any external image host (covers imageUrls stored in DB)
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
        {
          protocol: 'https',
          hostname: 'qwiumswrbddwmlraktvy.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // ââ Headers âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Service worker must not be cached
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  // ââ Redirects âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  async redirects() {
    return [
      // Force trailing-slash consistency
      {
        source: '/product/:slug/',
        destination: '/product/:slug',
        permanent: true,
      },
      {
        source: '/category/:slug/',
        destination: '/category/:slug',
        permanent: true,
      },
    ];
  },

  // ââ Compiler options ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  compiler: {
    // Remove console.log in production (keep console.error and console.warn)
    removeConsole:
      process.env['NODE_ENV'] === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // ââ Experimental ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  experimental: {
    // Partial Pre-rendering (PPR) â available in Next.js 15
    ppr: false,
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-toast',
    ],
  },

  // ââ Logging âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  logging: {
    fetches: {
      fullUrl: process.env['NODE_ENV'] === 'development',
    },
  },

  // ââ PWA âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // next-pwa configuration is applied via wrapper below

  // ââ TypeScript / ESLint âââââââââââââââââââââââââââââââââââââââââââââââââââââ
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// ââ Bundle analyzer wrapper âââââââââââââââââââââââââââââââââââââââââââââââââ
const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
  openAnalyzer: true,
});

export default withBundleAnalyzerConfig(nextConfig);
