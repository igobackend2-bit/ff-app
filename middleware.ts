import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Middleware runs on edge — no Node.js APIs ──────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Canonical slug redirect ──────────────────────────────────────────────
  // If a product is accessed at a wrong slug, the page itself will 301 redirect.
  // Middleware handles the case where URL has uppercase characters in slug.
  if (pathname.startsWith('/product/') || pathname.startsWith('/category/')) {
    const lowercasePath = pathname.toLowerCase();
    if (pathname !== lowercasePath) {
      const url = request.nextUrl.clone();
      url.pathname = lowercasePath;
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  // ── Auth-gated routes ────────────────────────────────────────────────────
  const protectedPaths = ['/account', '/checkout', '/orders'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // Check session cookie presence (full validation is done in route handlers)
    const sessionToken =
      request.cookies.get('next-auth.session-token') ??
      request.cookies.get('__Secure-next-auth.session-token');

    if (!sessionToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder assets
     * - API routes (handled individually)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|screenshots/|sw.js|workbox-.*|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)).*)',
  ],
};
