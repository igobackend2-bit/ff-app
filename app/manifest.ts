import type { MetadataRoute } from 'next';

// Skill #10 — PWA Web App Manifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Farmers Factory — Fresh Farm Products in 24 Hours',
    short_name: 'Farmers Factory',
    description: 'Fresh groceries delivered to your door in 24 hours.',
    start_url: '/?source=pwa',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2e7d4f',
    orientation: 'portrait-primary',
    categories: ['shopping', 'food'],
    lang: 'en-IN',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Farmers Factory Home — Shop groceries',
      },
      {
        src: '/screenshots/home-desktop.png',
        sizes: '1280x800',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Farmers Factory Desktop',
      },
    ],
    shortcuts: [
      {
        name: 'Search Groceries',
        short_name: 'Search',
        description: 'Search for groceries',
        url: '/search',
        icons: [{ src: '/icons/shortcut-search.png', sizes: '96x96' }],
      },
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View your order history',
        url: '/account/orders',
        icons: [{ src: '/icons/shortcut-orders.png', sizes: '96x96' }],
      },
    ],
  };
}
