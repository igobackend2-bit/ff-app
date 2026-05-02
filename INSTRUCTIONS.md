# ⚡ QuickCart — 10-Minute Grocery Delivery App
## Complete Build Instructions for Senior Full-Stack Developers

> **Version:** 1.0.0 | **Last Updated:** April 2026  
> **Stack:** Next.js 15 · TypeScript · Tailwind CSS · Zustand · Prisma + PostgreSQL  
> **Deployment Target:** Vercel  

---

## TABLE OF CONTENTS

1. [Project Overview & Mission](#1-project-overview--mission)
2. [Tech Stack & Rationale](#2-tech-stack--rationale)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema (Prisma)](#5-database-schema-prisma)
6. [Authentication Architecture](#6-authentication-architecture)
7. [App Router Pages & Routes](#7-app-router-pages--routes)
8. [Core UI Components](#8-core-ui-components)
9. [State Management (Zustand)](#9-state-management-zustand)
10. [API Routes](#10-api-routes)
11. [Image Handling Rules](#11-image-handling-rules)
12. [Performance Requirements](#12-performance-requirements)
13. [PWA Setup](#13-pwa-setup)
14. [SEO & Structured Data](#14-seo--structured-data)
15. [Accessibility (WCAG 2.1 AA)](#15-accessibility-wcag-21-aa)
16. [Build Pipeline & CI Rules](#16-build-pipeline--ci-rules)
17. [Feature Specifications](#17-feature-specifications)
18. [Deployment Checklist](#18-deployment-checklist)
19. [Known Zepto Weaknesses — How We Fix Them](#19-known-zepto-weaknesses--how-we-fix-them)
20. [Developer Conventions](#20-developer-conventions)

---

## 1. Project Overview & Mission

**QuickCart** is a mobile-first, PWA-enabled grocery delivery platform targeting 10-minute delivery in urban India. It is NOT a Zepto clone — it is a superior product designed by fixing every documented weakness in existing quick-commerce apps.

### Primary Goals
- Deliver groceries in ≤ 10 minutes via a dark-store network
- Fully installable PWA (no app store needed)
- Zero-compromise accessibility (screen reader + keyboard friendly)
- Core Web Vitals: all green, every page, every device

### Primary Viewport
- **Mobile-first:** 375px width base
- Responsive breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

---

## 2. Tech Stack & Rationale

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.x | RSC, streaming, built-in image opt |
| Language | TypeScript | 5.x | End-to-end type safety |
| Styling | Tailwind CSS | 3.4+ | Utility-first, purged CSS, zero runtime |
| State | Zustand | 4.x | Lightweight, no boilerplate, SSR-safe |
| ORM | Prisma | 5.x | Type-safe DB access, migrations |
| Database | PostgreSQL | 16.x | ACID, JSONB for product attributes |
| Auth | NextAuth.js v5 | 5.x | OTP + Google/Apple OAuth |
| Payments | Razorpay | latest | UPI, cards, wallets — India-first |
| Search | Algolia / Typesense | latest | Sub-50ms search |
| CDN/Media | Cloudinary | latest | Image transforms, AVIF/WebP on-the-fly |
| Maps | Google Maps Platform | latest | Delivery area polygon, ETA |
| Push Notif | Firebase Cloud Messaging | latest | Web push (PWA) |
| Analytics | PostHog (self-hostable) | latest | Via Partytown |
| Monitoring | Sentry | latest | Error + performance |
| Testing | Vitest + Playwright | latest | Unit + E2E |
| Bundle Check | @next/bundle-analyzer | latest | Keep JS < 1MB |

---

## 3. Repository Structure

```
quickcart/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── verify/page.tsx
│   ├── (shop)/
│   │   ├── layout.tsx            # Main shell with nav, cart sidebar
│   │   ├── page.tsx              # Homepage
│   │   ├── category/
│   │   │   └── [slug]/page.tsx
│   │   ├── product/
│   │   │   └── [slug]/page.tsx   # PDP — must have JSON-LD
│   │   ├── search/page.tsx
│   │   ├── cart/page.tsx
│   │   └── checkout/
│   │       ├── page.tsx
│   │       └── success/page.tsx
│   ├── account/
│   │   ├── orders/page.tsx
│   │   ├── addresses/page.tsx
│   │   └── profile/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── products/route.ts
│   │   ├── categories/route.ts
│   │   ├── cart/route.ts
│   │   ├── orders/route.ts
│   │   ├── search/route.ts
│   │   ├── address/route.ts
│   │   └── webhooks/
│   │       ├── razorpay/route.ts
│   │       └── fcm/route.ts
│   ├── globals.css
│   ├── layout.tsx                # Root layout — fonts, metadata, PWA meta
│   └── manifest.ts               # Dynamic Web App Manifest
│
├── components/
│   ├── ui/                       # Primitive components (Button, Input, Badge…)
│   ├── product/
│   │   ├── ProductCard.tsx       # Must use next/image, skeleton loader
│   │   ├── ProductGrid.tsx       # With shimmer skeleton fallback
│   │   ├── ProductCarousel.tsx
│   │   └── ProductQuickAdd.tsx   # +/- quantity controller
│   ├── cart/
│   │   ├── CartDrawer.tsx        # Slide-in, accessible focus trap
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx         # Mobile bottom navigation bar
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── search/
│   │   ├── SearchBar.tsx         # With instant suggestions
│   │   └── SearchResults.tsx
│   ├── checkout/
│   │   ├── AddressForm.tsx
│   │   ├── PaymentSection.tsx
│   │   └── OrderSummary.tsx
│   ├── common/
│   │   ├── SkeletonCard.tsx      # Shimmer skeleton for product cards
│   │   ├── SkeletonList.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── OfflineBanner.tsx
│   │   └── DeliveryCountdown.tsx # Real-time ETA timer
│   └── seo/
│       ├── ProductJsonLd.tsx
│       └── OrganizationJsonLd.tsx
│
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── razorpay.ts
│   ├── algolia.ts
│   ├── fcm.ts
│   ├── cloudinary.ts
│   └── utils.ts
│
├── store/                        # Zustand stores
│   ├── cartStore.ts
│   ├── userStore.ts
│   ├── locationStore.ts
│   └── uiStore.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── icons/                    # PWA icons: 192x192, 512x512, maskable
│   ├── sw.js                     # Service Worker (generated by next-pwa)
│   └── offline.html
│
├── scripts/
│   └── check-env-placeholders.sh # CI: fail if %NEXT_PUBLIC_* found in .next/
│
├── types/
│   ├── product.ts
│   ├── cart.ts
│   ├── order.ts
│   └── user.ts
│
├── hooks/
│   ├── useCart.ts
│   ├── useGeolocation.ts
│   ├── useDebounce.ts
│   └── usePushNotifications.ts
│
├── .env.example                  # REQUIRED — document every env var
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## 4. Environment Variables

Every variable below MUST exist in `.env.example`. Build fails if any are missing.

```bash
# .env.example

# ── App ───────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://quickcart.in
NEXT_PUBLIC_APP_NAME=QuickCart
NEXT_PUBLIC_DEFAULT_CITY=Mumbai

# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/quickcart

# ── Auth ──────────────────────────────────────────────
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# OTP via SMS (Twilio or MSG91)
SMS_PROVIDER=msg91
MSG91_API_KEY=
MSG91_SENDER_ID=

# ── Payments ──────────────────────────────────────────
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# ── Search ────────────────────────────────────────────
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=
ALGOLIA_INDEX_NAME=products

# ── Media ─────────────────────────────────────────────
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Maps ──────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# ── Push Notifications ────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_ADMIN_SDK_JSON=   # stringified JSON of service account

# ── Analytics ─────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# ── Monitoring ────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

### Build-Time Validation

In `next.config.ts`, add:

```typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'RAZORPAY_KEY_SECRET',
  'ALGOLIA_ADMIN_KEY',
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
```

---

## 5. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Users ────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  phone         String?   @unique
  email         String?   @unique
  name          String?
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  addresses     Address[]
  orders        Order[]
  cart          Cart?
  wishlist      WishlistItem[]
  reviews       Review[]
  sessions      Session[]
}

model Address {
  id            String    @id @default(cuid())
  userId        String
  label         String    // "Home", "Work", "Other"
  line1         String
  line2         String?
  city          String
  pincode       String
  lat           Float
  lng           Float
  isDefault     Boolean   @default(false)
  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
  orders        Order[]
}

// ── Catalogue ────────────────────────────────────────

model Category {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  imageUrl      String
  parentId      String?
  sortOrder     Int       @default(0)
  isActive      Boolean   @default(true)

  parent        Category?   @relation("SubCategories", fields: [parentId], references: [id])
  children      Category[]  @relation("SubCategories")
  products      Product[]
}

model Brand {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  logoUrl       String?

  products      Product[]
}

model Product {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  description   String?
  imageUrls     String[]  // ordered; first is primary
  categoryId    String
  brandId       String?
  sku           String    @unique
  barcode       String?
  mrp           Decimal   @db.Decimal(10,2)
  price         Decimal   @db.Decimal(10,2)
  unit          String    // "500g", "1L", "6 pack"
  tags          String[]
  attributes    Json?     // { "weight": "500g", "shelf_life": "6 months" }
  isActive      Boolean   @default(true)
  isFeatured    Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  category      Category  @relation(fields: [categoryId], references: [id])
  brand         Brand?    @relation(fields: [brandId], references: [id])
  inventory     Inventory[]
  cartItems     CartItem[]
  orderItems    OrderItem[]
  reviews       Review[]
  wishlistItems WishlistItem[]

  @@index([categoryId])
  @@index([slug])
}

model Inventory {
  id            String    @id @default(cuid())
  productId     String
  darkStoreId   String
  quantity      Int       @default(0)
  threshold     Int       @default(10)  // alert when below this

  product       Product   @relation(fields: [productId], references: [id])
  darkStore     DarkStore @relation(fields: [darkStoreId], references: [id])

  @@unique([productId, darkStoreId])
}

model DarkStore {
  id            String    @id @default(cuid())
  name          String
  city          String
  lat           Float
  lng           Float
  radiusKm      Float     @default(3.0)
  isActive      Boolean   @default(true)

  inventory     Inventory[]
  orders        Order[]
}

// ── Cart ─────────────────────────────────────────────

model Cart {
  id            String    @id @default(cuid())
  userId        String    @unique
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
  items         CartItem[]
}

model CartItem {
  id            String    @id @default(cuid())
  cartId        String
  productId     String
  quantity      Int

  cart          Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product       Product   @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
}

// ── Orders ───────────────────────────────────────────

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique @default(cuid())
  userId          String
  addressId       String
  darkStoreId     String
  status          OrderStatus @default(PLACED)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   String?
  razorpayOrderId String?
  razorpayPaymentId String?
  subtotal        Decimal     @db.Decimal(10,2)
  deliveryFee     Decimal     @db.Decimal(10,2) @default(0)
  discount        Decimal     @db.Decimal(10,2) @default(0)
  total           Decimal     @db.Decimal(10,2)
  estimatedAt     DateTime?
  deliveredAt     DateTime?
  cancelReason    String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id])
  address         Address     @relation(fields: [addressId], references: [id])
  darkStore       DarkStore   @relation(fields: [darkStoreId], references: [id])
  items           OrderItem[]

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id          String    @id @default(cuid())
  orderId     String
  productId   String
  quantity    Int
  unitPrice   Decimal   @db.Decimal(10,2)
  total       Decimal   @db.Decimal(10,2)

  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id])
}

enum OrderStatus {
  PLACED
  CONFIRMED
  PICKING
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

// ── Social ───────────────────────────────────────────

model Review {
  id          String    @id @default(cuid())
  userId      String
  productId   String
  rating      Int       // 1–5
  comment     String?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
  product     Product   @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
}

model WishlistItem {
  id          String    @id @default(cuid())
  userId      String
  productId   String
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
  product     Product   @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
}

// ── Auth (NextAuth adapter tables) ───────────────────

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier  String
  token       String   @unique
  expires     DateTime

  @@unique([identifier, token])
}
```

---

## 6. Authentication Architecture

### Strategy
- **Primary:** Phone OTP (India-first — no password friction)
- **Secondary:** Google OAuth (one-tap sign-in)
- **Session:** JWT stored in httpOnly cookie via NextAuth v5

### OTP Flow
1. User enters phone number
2. POST `/api/auth/otp/send` → MSG91 sends 6-digit OTP
3. Store hashed OTP + expiry (5 min) in `VerificationToken` table
4. User enters OTP → POST `/api/auth/otp/verify`
5. If valid, create/fetch user → issue NextAuth session

### NextAuth Config (`lib/auth.ts`)
```typescript
export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'phone-otp',
      // ... OTP verification logic
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) { /* attach userId to token */ },
    session({ session, token }) { /* attach userId to session */ },
  },
};
```

---

## 7. App Router Pages & Routes

### Route Map

| Route | Component | SSR/SSG | Notes |
|---|---|---|---|
| `/` | Homepage | SSG + ISR (60s) | Hero banners, category grid, featured products |
| `/category/[slug]` | Category Page | SSR | Filtered product grid |
| `/product/[slug]` | PDP | SSG + ISR (300s) | Full JSON-LD, reviews, add-to-cart |
| `/search` | Search Page | Client | Instant results via Algolia |
| `/cart` | Cart Page | Client | Zustand state, real-time totals |
| `/checkout` | Checkout | Server (auth-gated) | Address + Razorpay |
| `/checkout/success` | Order Confirmation | Server | Order summary + push notification |
| `/account/orders` | Order History | Server (auth-gated) | Paginated list |
| `/account/orders/[id]` | Order Detail | Server (auth-gated) | Live status tracking |
| `/account/addresses` | Address Manager | Client | CRUD addresses with map picker |
| `/account/profile` | Profile | Client | Name, email, preferences |
| `/login` | Auth Page | Client | Phone OTP + Google OAuth |

### Root Layout (`app/layout.tsx`)
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  // Never use a default title — every page must declare its own
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical fonts */}
        <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#16a34a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 8. Core UI Components

### ProductCard (CRITICAL — read carefully)
```typescript
// components/product/ProductCard.tsx
import Image from 'next/image';

// RULES:
// 1. ALWAYS use next/image — NEVER raw <img>
// 2. alt = product name + unit (e.g., "Amul Butter 500g")
// 3. Always include width/height for CLS prevention
// 4. Use sizes prop matching actual rendered breakpoints
// 5. Lazy-load all cards except first 4 (use priority on those)

export function ProductCard({ product, priority = false }: ProductCardProps) {
  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Image
        src={product.imageUrls[0]}
        alt={`${product.name} ${product.unit}`}
        width={300}
        height={300}
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        className="w-full aspect-square object-contain p-2"
      />
      {/* discount badge, add button, etc. */}
    </div>
  );
}
```

### SkeletonCard (shimmer loader — MANDATORY on all grids)
```typescript
// components/common/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded w-full mt-3" />
      </div>
    </div>
  );
}

// Usage in ProductGrid with Suspense:
// <Suspense fallback={<SkeletonGrid count={12} />}>
//   <ProductGridData categoryId={...} />
// </Suspense>
```

### CartDrawer (focus trap required)
- Use `@radix-ui/react-dialog` for accessible drawer
- Trap focus when open (`aria-modal="true"`)
- Close on Escape key and backdrop click
- Announce cart count change via `aria-live="polite"`

### DeliveryCountdown
- Shows real-time countdown from order placement
- Pulls ETA from order data
- Uses `setInterval` with cleanup on unmount
- Accessible: use `role="timer"` + `aria-live="assertive"`

### BottomNav (mobile)
```typescript
// 4 tabs: Home | Categories | Search | Account
// Active tab indicated by color + label (NOT color alone — WCAG 1.4.1)
// Use aria-current="page" on active tab
```

---

## 9. State Management (Zustand)

### Cart Store (`store/cartStore.ts`)
```typescript
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

// IMPORTANT: Persist cart to localStorage for guest users
// Sync with server cart on login via /api/cart/sync
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // ... implementation
    }),
    { name: 'quickcart-cart' }
  )
);
```

### Location Store (`store/locationStore.ts`)
```typescript
interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string | null;
  darkStoreId: string | null;
  setLocation: (lat: number, lng: number) => Promise<void>;
  // Reverse geocode + find nearest dark store
}
```

### UI Store (`store/uiStore.ts`)
```typescript
interface UIState {
  isSearchOpen: boolean;
  activeCategory: string | null;
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}
```

---

## 10. API Routes

All API routes must:
- Validate inputs with Zod
- Return consistent `{ data, error, message }` shape
- Use proper HTTP status codes
- Include rate limiting (via `@upstash/ratelimit` + Redis)

### Key Endpoints

```
GET  /api/products?category=&search=&page=&limit=
GET  /api/products/[slug]
GET  /api/categories
GET  /api/categories/[slug]/products

GET  /api/cart                    (auth required)
POST /api/cart/add
PUT  /api/cart/update
DELETE /api/cart/remove/[productId]
POST /api/cart/sync               (merge guest cart on login)

POST /api/orders                  (create order + Razorpay order)
GET  /api/orders                  (user order history)
GET  /api/orders/[id]
POST /api/orders/[id]/cancel

POST /api/address
PUT  /api/address/[id]
DELETE /api/address/[id]

POST /api/auth/otp/send
POST /api/auth/otp/verify

POST /api/webhooks/razorpay       (payment confirmation)

GET  /api/search?q=               (proxy to Algolia or Typesense)

GET  /api/store/nearby?lat=&lng=  (find nearest dark store + delivery ETA)
```

---

## 11. Image Handling Rules

### next.config.ts — MANDATORY
```typescript
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],  // REQUIRED
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/your-cloud-name/**',
      },
    ],
    deviceSizes: [400, 800, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256],
  },
};
```

### Rules — Enforced in Code Review
1. **NEVER use raw `<img>` tags** — always `import Image from 'next/image'`
2. **alt text format:** `{productName} {unit}` (e.g., `"Amul Gold Milk 1L"`)
3. **Banner images:** `alt={banner.altText}` — must be set in CMS/DB
4. **Decorative images only:** `alt=""` + `role="presentation"`
5. **Provide `sizes` prop** on all Images to prevent oversized downloads
6. **Use `priority={true}`** only on above-the-fold images (max 2 per page)
7. **Never use UUID/hash strings as alt text**

---

## 12. Performance Requirements

### Targets
| Metric | Target | Hard Limit |
|---|---|---|
| LCP | < 2.5s | < 4s |
| CLS | < 0.1 | < 0.25 |
| INP | < 200ms | < 500ms |
| JS Bundle | < 800KB | < 1MB |
| First Load JS per route | < 150KB | — |

### Implementation Checklist

**Fonts**
- Self-host Inter (or Geist) — no Google Fonts (external DNS lookup)
- Use `next/font` with `display: 'swap'`
- Preload Regular (400) + Bold (700) only

**Scripts (Third-Party)**
- ALL analytics/pixel scripts MUST load via Partytown
- No synchronous third-party scripts in `<head>`

**Code Splitting**
- Every major page is a separate chunk via App Router (automatic)
- Dynamic import heavy components: `const RazorpayButton = dynamic(() => import(...))`
- Dynamic import map components (Google Maps SDK is heavy)

**Images**
- Lazy load ALL images below the fold
- Use `placeholder="blur"` with `blurDataURL` for product images
- Store `blurDataURL` in DB alongside product images (generate via Cloudinary)

**Data Fetching**
- Use React cache() for repeated DB calls within a request
- ISR for product pages (revalidate: 300 seconds)
- Streaming with Suspense for dynamic sections

**Bundle Analysis**
```bash
ANALYZE=true next build
# Check: app/page.js < 150KB, no duplicate packages
```

---

## 13. PWA Setup

### Package
```bash
npm install next-pwa
```

### next.config.ts
```typescript
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Cache product images
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'product-images',
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // Cache API responses (short TTL)
    {
      urlPattern: /^https:\/\/quickcart\.in\/api\/categories/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-categories',
        expiration: { maxAgeSeconds: 60 * 60 },
      },
    },
  ],
})(nextConfig);
```

### Web App Manifest (`app/manifest.ts`)
```typescript
import { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QuickCart — 10-Minute Grocery',
    short_name: 'QuickCart',
    description: 'Fresh groceries delivered in 10 minutes',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    orientation: 'portrait',
    categories: ['shopping', 'food'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { src: '/screenshots/home-mobile.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' },
    ],
  };
}
```

### Push Notifications (FCM)
- Request permission only after user places first order
- Show in-app prompt before browser permission dialog
- Topics: `order-updates-{orderId}`, `offers-{userId}`, `restock-{productId}`
- Service worker handles background notifications (`public/firebase-messaging-sw.js`)

### Offline Shell
- Cache app shell (layout, fonts, icons) on install
- Show `OfflineBanner` component when `navigator.onLine === false`
- Cache last-viewed category pages
- Cart state persisted in localStorage (works offline)

---

## 14. SEO & Structured Data

### Every Page Must Have (via Next.js `metadata`)
```typescript
export const metadata: Metadata = {
  title: 'Unique Page Title | QuickCart',
  description: 'Unique, keyword-rich description under 155 chars',
  openGraph: {
    title: '...',
    description: '...',
    images: [{ url: '...', width: 1200, height: 630, alt: '...' }],
    url: 'https://quickcart.in/...',
    siteName: 'QuickCart',
  },
  twitter: { card: 'summary_large_image', ... },
  alternates: { canonical: 'https://quickcart.in/...' },
  robots: { index: true, follow: true },
};
```

### Product Detail Page (PDP) — JSON-LD (MANDATORY)
```typescript
// components/seo/ProductJsonLd.tsx
export function ProductJsonLd({ product }: { product: Product }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrls,
    description: product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand?.name },
    offers: {
      '@type': 'Offer',
      price: product.price.toString(),
      priceCurrency: 'INR',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'QuickCart' },
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    } : undefined,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Homepage — Organization + WebSite JSON-LD
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "QuickCart",
      "url": "https://quickcart.in",
      "logo": "https://quickcart.in/icons/logo.png",
      "contactPoint": { "@type": "ContactPoint", "contactType": "customer service" }
    },
    {
      "@type": "WebSite",
      "url": "https://quickcart.in",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://quickcart.in/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

### Sitemap (`app/sitemap.ts`)
- Include all category pages + all product pages
- Use `lastModified` from DB `updatedAt`
- Exclude `/account/*`, `/checkout/*`, `/api/*`

---

## 15. Accessibility (WCAG 2.1 AA)

### Hard Requirements — Block Merge if Violated

| Rule | Detail |
|---|---|
| Color contrast | Text: 4.5:1 minimum. Large text: 3:1. Use Colour Contrast Analyser to check. |
| Focus indicators | NEVER remove outline entirely — use `ring-2 ring-green-500 ring-offset-2` |
| Keyboard navigation | All interactive elements reachable and operable via keyboard only |
| Touch targets | Minimum 44×44px on all buttons/links (48px preferred) |
| Form labels | Every `<input>` has an associated `<label>` or `aria-label` |
| Error messages | Use `aria-describedby` to link inputs to error text |
| Images | Non-decorative images have meaningful alt text (see §11) |
| Motion | Respect `prefers-reduced-motion` — disable animations/transitions |
| Live regions | Cart updates, toast notifications use `aria-live="polite"` |
| Page titles | Every page has a unique, descriptive `<title>` |
| Language | `<html lang="en">` (change per locale if i18n added) |
| Skip link | `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` |
| Modals/drawers | Focus trap + `aria-modal="true"` + return focus on close |
| Tab order | Logical DOM order — never use `tabindex > 0` |

### Tailwind Accessibility Utilities
```typescript
// Focus ring (replace browser default):
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"

// Visually hidden but accessible:
className="sr-only"

// Reduced motion:
className="motion-safe:animate-pulse"  // Only animate if user allows it
```

---

## 16. Build Pipeline & CI Rules

### CI Steps (GitHub Actions)

```yaml
# .github/workflows/ci.yml

jobs:
  build:
    steps:
      - name: Type Check
        run: npx tsc --noEmit

      - name: Lint
        run: npx eslint . --max-warnings=0

      - name: Unit Tests
        run: npx vitest run

      - name: Build
        run: npm run build
        env:
          # Inject all required env vars from GitHub secrets

      - name: Check for unresolved env placeholders
        run: bash scripts/check-env-placeholders.sh

      - name: E2E Tests
        run: npx playwright test

      - name: Bundle Size Check
        run: |
          node -e "
            const stats = require('.next/build-manifest.json');
            // Assert total JS < 1MB
          "

  accessibility:
    steps:
      - name: Axe Accessibility Scan
        run: npx @axe-core/cli http://localhost:3000 --exit
```

### Placeholder Check Script
```bash
#!/bin/bash
# scripts/check-env-placeholders.sh
# Fail CI if any %NEXT_PUBLIC_*% placeholders survive in the build

FOUND=$(grep -r '%NEXT_PUBLIC_' .next/ 2>/dev/null || true)
if [ -n "$FOUND" ]; then
  echo "❌ UNRESOLVED ENV PLACEHOLDERS FOUND IN BUILD:"
  echo "$FOUND"
  exit 1
fi
echo "✅ No unresolved env placeholders found."
```

### Pre-commit Hooks (Husky)
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

---

## 17. Feature Specifications

### 17.1 Homepage
- **Hero Section:** Full-width banner carousel (3–5 banners, auto-play with pause on hover/focus)
- **Delivery Header:** Shows current address + ETA chip ("⚡ Delivery in 8 mins")
- **Category Grid:** 2-col mobile, 4-col desktop, image + name
- **Flash Deals:** Horizontal scroll with countdown timer
- **Deals of the Day:** Product grid, skeleton loader on mount
- **Brand Shelf:** Horizontal brand logos

### 17.2 Category / Listing Page
- **Filters:** Price range, brand, dietary tags (Veg/Vegan/Gluten-free)
- **Sort:** Relevance | Price Low-High | Price High-Low | Discount | New
- **Infinite scroll** or pagination (configurable)
- **Sticky filter bar** on scroll

### 17.3 Product Detail Page (PDP)
- **Image gallery:** Swipeable on mobile, zoom on desktop
- **Quantity selector** with max-stock guard
- **Nutritional info accordion** (where available)
- **Similar products** carousel
- **Reviews section** with rating distribution bar chart
- **Sticky Add to Cart** button on mobile (bottom of screen)

### 17.4 Search
- **Instant search** with 300ms debounce
- **Search suggestions** dropdown (product + category)
- **Recent searches** (persisted in localStorage)
- **Voice search** button (Web Speech API)
- **Zero results** state with suggestions
- **Search analytics** event to PostHog

### 17.5 Cart & Checkout
- **Cart Drawer:** Slide-in panel (desktop), full-page (mobile)
- **Delivery slot:** Instant delivery (default) + scheduled slot picker
- **Address:** Detect location via GPS → reverse geocode → confirm
- **Coupon:** Code input with live validation
- **Payment:** Razorpay sheet (UPI, Cards, Wallets, Net Banking)
- **Order confirmation:** Animated success screen + push notification opt-in

### 17.6 Order Tracking
- **Live status timeline:** Placed → Confirmed → Picking → Out for Delivery → Delivered
- **Map view:** Rider location (if available via Google Maps)
- **Cancel window:** Allow cancel within 60s of placement
- **Rating prompt:** After delivery — rate order in 2 taps

### 17.7 Account
- **Order history:** Paginated, searchable
- **One-tap reorder:** Reorder entire previous order
- **Address book:** Save multiple, set default
- **Preferences:** Dietary filters, notification settings

### 17.8 Admin / Dark Store Dashboard (separate Next.js app or `/admin` route, auth-gated)
- Order management queue (PLACED → CONFIRMED → PICKING)
- Inventory management
- Dark store configuration
- Basic analytics (orders/day, GMV, avg order value)

---

## 18. Deployment Checklist

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["bom1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(self)" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

### Pre-launch Checklist
- [ ] All env vars set in Vercel dashboard (production)
- [ ] Database connection string points to production Postgres
- [ ] Razorpay in live mode (not test)
- [ ] Algolia index populated with all products
- [ ] PWA icons generated for all sizes (192, 512, maskable)
- [ ] robots.txt allows crawling of `/`, `/category/*`, `/product/*`
- [ ] sitemap.xml accessible at `/sitemap.xml`
- [ ] Google Search Console verified
- [ ] Sentry DSN set and error tracking confirmed
- [ ] PageSpeed Insights run on Homepage, a Category page, and a PDP — all green
- [ ] Lighthouse PWA audit score ≥ 90
- [ ] WCAG scan (axe) returns 0 critical violations
- [ ] Bundle analyzer run — total JS < 1MB confirmed

---

## 19. Known Zepto Weaknesses — How We Fix Them

| Zepto Weakness | QuickCart Solution |
|---|---|
| No PWA / web app | Full PWA: installable, offline shell, push notifications |
| Poor accessibility | WCAG 2.1 AA enforcement via CI axe scan |
| Slow search on low-end devices | Algolia/Typesense with client-side debounce |
| CLS issues on product images | Always explicit width/height + aspect-ratio CSS |
| Cart resets on page refresh | Zustand persist middleware → localStorage |
| Phone OTP only, no biometrics | Passkey / WebAuthn support in v2 roadmap |
| No offline support | Service Worker + cache-first for product images |
| No scheduled delivery slot | Slot picker in checkout (hourly windows) |
| No voice search | Web Speech API integrated in search bar |
| Confusing order cancellation | Cancel within 60s, clear UI, instant refund trigger |
| No dietary/lifestyle filters | Veg / Vegan / Gluten-free / Organic tags on all products |
| No one-tap reorder | "Order Again" CTA on every past order card |
| Poor SEO (SPA-only) | Full SSG/ISR for all catalogue pages + JSON-LD |

---

## 20. Developer Conventions

### TypeScript
- `strict: true` in `tsconfig.json` — no exceptions
- No `any` types — use `unknown` + type guards
- All API responses typed (use Zod for runtime + infer type)
- No implicit `undefined` — always handle null cases

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Stores: `camelCaseStore.ts`
- Utilities: `kebab-case.ts`
- API routes: `route.ts` (App Router convention)

### Component Rules
- Every component has a named export (no default exports for components)
- Props interfaces named `{ComponentName}Props`
- Use `forwardRef` for form elements
- Separate container (data-fetching) and presentational components

### Git Conventions
```
feat: add one-tap reorder from order history
fix: prevent CLS on category page image grid
perf: lazy-load Google Maps SDK on checkout only
a11y: add focus trap to cart drawer
chore: update Prisma to v5.12
```

### Code Review Gates
- PR cannot merge if:
  - TypeScript errors exist
  - ESLint warnings > 0
  - Axe accessibility violations found
  - Bundle size regressed by > 10%
  - Any `<img>` tag used instead of `next/image`
  - Any alt text is empty string (except decorative images with `role="presentation"`)
  - ENV placeholder check fails

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/yourorg/quickcart.git
cd quickcart
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in all values in .env.local

# 3. Set up database
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed database (optional, dev only)
npx ts-node prisma/seed.ts

# 5. Run dev server
npm run dev
# → http://localhost:3000

# 6. Run tests
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E

# 7. Analyze bundle
ANALYZE=true npm run build
```

---

*This document is the single source of truth for the QuickCart codebase. All architectural decisions, conventions, and requirements are captured here. Update this file when decisions change.*
