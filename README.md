# Farmers Factory

Quick-commerce grocery delivery app (internally also referred to as **QuickCart** in some docs/UI copy) for **Farmers Factory**, live at `farmersfactory.igogroups.com`. Built with Next.js 15 (App Router), Prisma, NextAuth, and Supabase. Ships as a web app plus two experimental native-wrapper builds for Android/iOS.

> Prior static HTML prototypes (`index.html`, `cart.html`, `login.html`, `admin/*.html`, `ZeptoClone.html`, `swiftshop.html`, `farmers-factory.html`, and the `js/`/`css/` folders) live at the repo root alongside the real app. **The Next.js app under `app/` is the live product** — the loose HTML files are earlier prototypes/reference clones, not the deployed site.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 18, TypeScript |
| Database/ORM | Prisma 5 — SQLite locally (`prisma/dev.db`), PostgreSQL in production |
| Auth | NextAuth v5 (beta) + Prisma adapter |
| Backend services | Supabase (auth/storage alongside NextAuth), Upstash Redis (rate limiting) |
| Email | Resend, Nodemailer |
| State | Zustand |
| Styling | Tailwind CSS, Radix UI primitives, Framer Motion |
| Testing | Vitest (unit), Playwright (e2e) |
| Mobile | Capacitor (Android) and Expo (Android/iOS) — two parallel WebView-wrapper approaches, see below |

## Getting started

Full walkthrough (including troubleshooting) is in `RUN-DEV.md`; short version:

\```bash
npm install
npx prisma generate
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts   # seed demo products/categories
npm run dev
\```

Windows: double-click `RUN.bat` to do all of the above automatically. The dev server runs on **port 3001** by default (`npm run dev`), not 3000.

| Page | URL |
|---|---|
| Homepage | `/` |
| Search | `/search` |
| Category | `/category/snacks` |
| Login | `/login` |
| Orders | `/account/orders` |

For production, swap `DATABASE_URL` in `.env.local` to a real PostgreSQL connection string and switch the Prisma `provider` in `prisma/schema.prisma` back to `postgresql`, then `npm run build && npm start`.

## Scripts

\```bash
npm run dev          # dev server, port 3001
npm run build         # next build (Vercel build command also runs `prisma generate` first)
npm run start          # production server
npm run lint             # next lint --max-warnings=0
npm run typecheck        # tsc --noEmit
npm run format             # prettier --write .
npm run test                # vitest run
npm run test:e2e             # playwright test
npm run prisma:studio         # Prisma Studio GUI
npm run check-env              # scripts/check-env-placeholders.sh — verifies .env has no leftover placeholder values
\```

Husky + lint-staged run ESLint/Prettier on staged files pre-commit.

## App structure

\```
app/
├── (shop)/        Storefront routes (grouped, no URL segment)
├── (auth)/         Login/signup/OTP flows (grouped)
├── admin/           Admin panel (Next.js routes — separate from admin/*.html below)
├── account/          Account, addresses, wishlist, orders
├── checkout/          Checkout flow
├── categories/          Category browsing
├── api/                  Route handlers: admin, auth, banners, categories, contact,
│                          delivery-config, location, notifications, orders, products,
│                          push-token, user, wishlist
├── fitai/                 AI-related feature area
├── about/, blog/, careers/, contact/, cookies/, fssai/, help/,
│   press/, privacy/, returns/, support/, terms/    Static/marketing pages
├── layout.tsx, globals.css, manifest.ts, robots.ts, sitemap.ts

components/         By feature: account, admin, auth, cart, category, checkout,
                     common, fitai, home, layout, location, orders, product,
                     search, seo, ui, wishlist

lib/                 auth.ts, db.ts, supabase.ts, erp-sync.ts, validations.ts,
                     utils.ts, clean-name.ts, plus catalog seed data
                     (demo-data.ts, extra-products.ts, fruit-catalog.ts,
                     valluvam-catalog.ts, vegetable-catalog.ts)

store/               Zustand stores: cart, address, location, product detail, ui, user, wishlist

prisma/              schema.prisma, dev.db (local SQLite), seed.ts + seed-vegetables.ts
supabase/            schema.sql (Supabase-side schema)
schema.sql, supabase-setup.sql, supabase-banners.sql   Root-level SQL setup scripts
middleware.ts         Canonical-slug redirects, admin session gate (ff_adm_s cookie,
                       2-hour expiry), and auth gate on /checkout and /orders
\```

### Prisma models

`User`, `Account`, `Session`, `VerificationToken`, `Address`, `DarkStore`, `Category`, `Brand`, `Product`, `Inventory`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Review`, `WishlistItem`, `Coupon`, `Banner`.

## Auth & sessions

Two auth layers coexist: **NextAuth** (`next-auth.session-token` / `__Secure-next-auth.session-token` cookies, plus a legacy `ff_auth` cookie) gates `/checkout` and `/orders`; a separate lightweight cookie (`ff_adm_s`, 2-hour expiry) gates the admin panel, checked in `middleware.ts` rather than through NextAuth. `middleware.ts` also 301-redirects `/product/*` and `/category/*` URLs to their lowercase form for canonical slugs.

## Mobile builds

Two independent, unfinished approaches to wrapping the deployed web app natively — pick one, they're not meant to be used together:

- **Capacitor** (`capacitor.config.ts`, `android-signing-patch.gradle`, `BUILD-ANDROID.bat`, `farmers-factory-release.jks`) — see `MOBILE-BUILD-GUIDE.md`. Requires a local Android Studio/SDK setup and a deployed production URL (Capacitor wraps the *live* site, not the local dev server).
- **Expo** (`expo-mobile/`) — see `expo-mobile/README.md`. A WebView-based Expo app that builds in the cloud via EAS, no local Android SDK needed. Update the target URL in `expo-mobile/App.tsx` before building. Package ID: `com.igogroups.farmersfactory`.

**The release keystore (`farmers-factory-release.jks`) is committed to this repo.** If this is meant to sign real Play Store releases, treat it as compromised and regenerate/rotate it — committed signing keys should not be relied on for production app signing.

## Known gaps / cleanup notes

- Root-level loose HTML/JS/CSS prototype files (`ZeptoClone.html`, `swiftshop.html`, `farmers-factory.html`, `index.html`, `cart.html`, `login.html`, `account.html`, etc., plus `js/` and `css/`) appear to predate the Next.js rewrite and aren't part of the deployed app — worth removing if confirmed obsolete.
- Numerous one-off debug/scratch scripts are committed at the repo root: `tmp-*.ts`/`tmp-*.js` (token/hash inspection), `check-db.js`/`check-db.ts`, `find_orders.js`, `create_mock_order.js`, `create_test_env.js`, `read_log.js`, `test-gmail.mjs`, `test-hash.ts`, `test-otp-logic.ts`, `test-verification.ts`, plus log files (`build_output.log`, `output.log`, `tsc.log`, `lint_output.txt`, `db-results.json`). None of these look required for running the app.
- `prisma/dev.db` (a 28 MB SQLite database) is committed — fine for quick local bootstrap, but shouldn't be treated as a source of truth; production uses PostgreSQL.
- `AUDIT.md` is a pre-launch self-audit checklist (SEO, accessibility, security) worth re-running before any production deploy — see also `scripts/check-env-placeholders.sh`.
- `INSTRUCTIONS.md` is a large (44 KB) internal doc — check it for anything not covered here.
