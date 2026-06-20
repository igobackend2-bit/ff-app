import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { SearchOverlay } from '@/components/search/SearchOverlay';
import { AuthModal } from '@/components/auth/AuthModal';
import { WishlistDrawer } from '@/components/wishlist/WishlistDrawer';
import { ProductDetailSheet } from '@/components/product/ProductDetailSheet';

// Force fresh HTML every time — prevents CDN caching old footer/header
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Shop layout — wraps all consumer-facing pages
// Header + main + BottomNav (mobile) + Footer
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Skill #29 — id="main-content" is the SkipNavLink target */}
      <main
        id="main-content"
        className="flex-1 pb-20 md:pb-0" // pb-20 = space for mobile BottomNav
        tabIndex={-1} // Allows focus when skip link is activated
      >
        {children}
      </main>

      <Footer />
      <BottomNav />
      
      {/* Global Modals */}
      <SearchOverlay />
      <AuthModal />
      <WishlistDrawer />
      <ProductDetailSheet />
    </div>
  );
}
