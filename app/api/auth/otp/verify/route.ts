import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { otpVerifySchema } from '@/lib/validations';
import { signIn } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const result = otpVerifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { name, phone, otp } = result.data;
    const email = result.data.email.trim().toLowerCase();

    // Use NextAuth signIn to verify and create session
    // Note: Since we are in a Route Handler, calling the server-side signIn 
    // will perform the authorize check defined in lib/auth.ts.
    try {
      const response = await signIn('credentials', {
        name,
        email,
        phone,
        otp,
        redirect: false,
      });

      if (!response) {
        return NextResponse.json({ error: 'Invalid OTP or expired' }, { status: 401 });
      }

      // 3. fetch fresh user data (ensuring Name and Email are included)
      // Use findUnique on phone first as it's the primary way we identify users
      let user = await prisma.user.findUnique({
        where: { phone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          referralCode: true,
          loyaltyPoints: true,
        },
      });

      // fallback to email if phone not found (though phone should be there)
      if (!user && email) {
        user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            referralCode: true,
            loyaltyPoints: true,
          },
        });
      }

      console.log('[Auth API] Returning user data:', user);

      return NextResponse.json({ message: 'Logged in successfully', user });
    } catch (error: unknown) {
      // Auth.js v5 throws specific errors
      if (
        typeof error === 'object' &&
        error !== null &&
        'type' in error &&
        error.type === 'CredentialsSignin'
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
