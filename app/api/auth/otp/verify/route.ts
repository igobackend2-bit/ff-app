import { NextRequest, NextResponse } from 'next/server';
import { otpVerifySchema } from '@/lib/validations';
import { signIn } from '@/lib/auth';

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

    const { name, email, phone, otp } = result.data;

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

      return NextResponse.json({ message: 'Logged in successfully' });
    } catch (error: any) {
      // Auth.js v5 throws specific errors
      if (error.type === 'CredentialsSignin') {
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
