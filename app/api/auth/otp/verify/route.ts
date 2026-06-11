import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
        user = {
          id:            `phone:${phone}`,
          name:          name || `Farmer ${phone.slice(-4)}`,
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
