import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { encode } from 'next-auth/jwt';
import { signIn, AUTH_SECRET } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProfileName, saveProfileName } from '@/lib/user-profile';

// NextAuth v5 session cookie name (Secure prefix on HTTPS / production)
const SESSION_COOKIE =
  process.env['NODE_ENV'] === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Manually mint the NextAuth JWT session cookie. Calling signIn(redirect:false)
 * inside a route handler does not reliably persist the cookie, which left users
 * "logged in" on the client but unauthenticated server-side (orders → 401).
 */
async function setSessionCookie(
  res: NextResponse,
  user: { id: string; name?: unknown; email?: unknown; phone?: unknown },
) {
  const token = await encode({
    token: {
      sub:   String(user.id),
      id:    String(user.id),
      name:  (user.name as string) ?? null,
      email: (user.email as string) ?? null,
      phone: (user.phone as string) ?? null,
    },
    secret: AUTH_SECRET,
    salt:   SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE,
  });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: SESSION_MAX_AGE,
  });
}

const otpVerifySchema = z.object({
  phone:    z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid phone number'),
  otp:      z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  name:     z.string().optional(),
  otpToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body   = (await req.json()) as unknown;
    const result = otpVerifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { phone, otp, name } = result.data;
    // Prefer body token; fall back to the httpOnly cookie set at send time
    const otpToken = result.data.otpToken || req.cookies.get('ff_otp_tok')?.value || '';

    try {
      // Use NextAuth credentials provider — identifier is phone
      const response = await signIn('credentials', {
        phone,
        otp,
        otpToken: otpToken ?? '',
        name:     name ?? '',
        email:    '',          // not used in phone-only flow
        redirect: false,
      });

      if (!response) {
        return NextResponse.json({ error: 'Invalid OTP or expired' }, { status: 401 });
      }

      // Fetch the user record after successful auth (best effort — DB may be down)
      const userSelect = {
        id:            true,
        name:          true,
        email:         true,
        phone:         true,
        avatarUrl:     true,
        referralCode:  true,
        loyaltyPoints: true,
      } as const;

      let user: Record<string, unknown> | null = null;
      try {
        user = await prisma.user.findUnique({ where: { phone }, select: userSelect });
      } catch { /* DB unavailable — fall back to JWT-only user below */ }

      if (!user) {
        // If a name was explicitly given (signup), persist it. Otherwise, load
        // whatever name was previously saved for this phone (profile edit or checkout).
        let resolvedName = name;
        if (resolvedName) {
          void saveProfileName(phone, resolvedName);
        } else {
          resolvedName = (await getProfileName(phone).catch(() => null)) ?? undefined;
        }

        user = {
          id:            `phone:${phone}`,
          name:          resolvedName || `Farmer ${phone.slice(-4)}`,
          email:         null,
          phone,
          avatarUrl:     null,
          referralCode:  null,
          loyaltyPoints: 0,
          walletBalance: 0,
        };
      }

      const okRes = NextResponse.json({ message: 'Logged in successfully', user });
      okRes.cookies.set('ff_otp_tok', '', { httpOnly: true, path: '/', maxAge: 0 });
      // Persist the real NextAuth session cookie so server-side auth() works
      await setSessionCookie(okRes, user as { id: string; name?: unknown; email?: unknown; phone?: unknown });
      return okRes;
    } catch (error: unknown) {
      // Auth.js v5 throws CredentialsSignin on wrong OTP
      if (
        typeof error === 'object' &&
        error !== null &&
        'type' in error &&
        (error as { type: string }).type === 'CredentialsSignin'
      ) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
      }
      console.error('SignIn error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
