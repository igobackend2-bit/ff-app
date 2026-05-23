import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonical slug redirect
  if (pathname.startsWith('/product/') || pathname.startsWith('/category/')) {
    const lowercasePath = pathname.toLowerCase();
    if (pathname !== lowercasePath) {
      const url = request.nextUrl.clone();
      url.pathname = lowercasePath;
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  // Admin routes — skip login page and the login/me API endpoints
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isAdminPublic =
    pathname === '/admin/login' ||
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/me';

  if (isAdminRoute && !isAdminPublic) {
    const adminAuth  = request.cookies.get('ff_adm_s');
    const loginTime  = parseInt(adminAuth?.value ?? '0', 10);
    const SESSION_MS = 60 * 60 * 2 * 1000; // 2 hours
    const valid      = loginTime > 0 && (Date.now() - loginTime) < SESSION_MS;
    if (!valid) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.set('ff_admin',  '', { path: '/', maxAge: 0 }); // clear legacy
      redirectRes.cookies.set('ff_adm_s', '', { path: '/', maxAge: 0 }); // clear expired
      return redirectRes;
    }
  }

  // Auth-gated user routes
  const protectedPaths = ['/checkout', '/orders'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const ffAuth = request.cookies.get('ff_auth');
    const sessionToken =
      request.cookies.get('next-auth.session-token') ??
      request.cookies.get('__Secure-next-auth.session-token');

    if (!ffAuth && !sessionToken) {
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
    '/((?!_next/static|_next/image|favicon.ico|icons/|screenshots/|sw.js|workbox-.*|.*\\.html|.*\\.(?:png|jpg|jpeg|svg|gif|webp|jfif|ico|woff2?)).*)',
  ],
};
