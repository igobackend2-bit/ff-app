import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SkipNavLink } from '@/components/common/SkipNavLink';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SplashScreen } from '@/components/common/SplashScreen';
import { Toaster } from '@/components/common/Toaster';
import { LocationModal } from '@/components/location/LocationModal';

// ── Fonts ─────────────────────────────────────────────────────────────────────
// Skill #34: Preload Regular (400) and Bold (700) weights only
// next/font handles preloading automatically with display: 'swap'
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  preload: false, // Mono only used for order numbers — no preload needed
});

// ── Viewport ──────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // WCAG: never disable user zoom
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2e7d4f' },
    { media: '(prefers-color-scheme: dark)', color: '#1b5e35' },
  ],
};

// ── Metadata ──────────────────────────────────────────────────────────────────
// Skill #18: Unique metadata per page — this is the BASE ONLY
// Every page MUST override title and description via generateMetadata()
export const metadata: Metadata = {
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://farmersfactory.in'),
  title: {
    default: 'Farmers Factory — Groceries in 24 Hours',
    template: '%s | Farmers Factory',
  },
  description:
    'Order fresh groceries, vegetables, fruits and daily essentials online. Get 24-hour delivery from Farmers Factory.',
  applicationName: 'Farmers Factory',
  keywords: ['grocery delivery', '24 hour delivery', 'online grocery', 'quick commerce', 'farm fresh'],
  authors: [{ name: 'Farmers Factory Technologies' }],
  creator: 'Farmers Factory Technologies Pvt. Ltd.',
  publisher: 'Farmers Factory Technologies Pvt. Ltd.',

  // PWA
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Farmers Factory',
  },

  // Open Graph (Skill #24)
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://farmersfactory.in',
    siteName: 'Farmers Factory',
    title: 'Farmers Factory — Groceries in 24 Hours',
    description: 'Order groceries online. 24-hour delivery in Mumbai, Delhi, Bangalore & more.',
    images: [
      {
        url: '/og/home.jpg',
        width: 1200,
        height: 630,
        alt: 'Farmers Factory — fresh farm products delivered in 24 hours',
      },
    ],
  },

  // Twitter Card (Skill #24)
  twitter: {
    card: 'summary_large_image',
    title: 'Farmers Factory — Groceries in 24 Hours',
    description: 'Fresh groceries delivered to your door in 24 hours.',
    images: ['/og/home.jpg'],
    creator: '@farmersfactory_in',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification
  verification: {
    google: process.env['GOOGLE_SITE_VERIFICATION'],
  },
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Skill #34 — Preload critical fonts */}
        {/* next/font handles preloading automatically — additional explicit preload for WOFF2 */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* PWA icons */}
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="icon" type="image/jpg" sizes="32x32" href="/logo.jpg" />
        <link rel="icon" type="image/jpg" sizes="16x16" href="/logo.jpg" />
      </head>

      <body className="font-sans">
        {/* Animated splash screen — shown once per session */}
        <SplashScreen />

        {/* Skill #29 — Skip nav MUST be first element in body */}
        <SkipNavLink />

        {/* Main app */}
        {children}

        {/* Cart drawer — rendered at root level to avoid z-index issues */}
        <CartDrawer />
        <LocationModal />
        <Toaster />
      </body>
    </html>
  );
}
