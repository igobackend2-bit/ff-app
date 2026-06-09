import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';

const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid phone number'),
  otp:   z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  name:  z.string().optional(),
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

    try {
      // Use NextAuth credentials provider — identifier is phone
      const response = await signIn('credentials', {
        phone,
        otp,
        name:     name ?? '',
        email:    '',          // not used in phone-only flow
        redirect: false,
      });

      if (!response) {
        return NextResponse.json({ error: 'Invalid OTP or expired' }, { status: 401 });
      }

      // Fetch the user record after successful auth
      const userSelect = {
        id:            true,
        name:          true,
        email:         true,
        phone:         true,
        avatarUrl:     true,
        referralCode:  true,
        loyaltyPoints: true,
      } as const;

      const user = await prisma.user.findUnique({ where: { phone }, select: userSelect });

      return NextResponse.json({ message: 'Logged in successfully', user });
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
