import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { otpVerifySchema } from '@/lib/validations';
import { signIn } from '@/lib/auth';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}` };

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

      // 3. fetch fresh user data
      let userRes = email
        ? await fetch(`${SB}/rest/v1/users?email=eq.${encodeURIComponent(email)}&limit=1`, { headers: sbH, cache: 'no-store' })
        : null;
      let userRows: any[] = userRes ? await userRes.json() : [];
      if (!userRows.length && phone?.trim()) {
        const r2 = await fetch(`${SB}/rest/v1/users?phone=eq.${encodeURIComponent(phone)}&limit=1`, { headers: sbH, cache: 'no-store' });
        userRows = await r2.json();
      }
      const user = userRows[0] ?? null;
      const mappedUser = user ? {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        avatarUrl: user.avatar_url, referralCode: user.referral_code, loyaltyPoints: user.loyalty_points,
      } : null;

      return NextResponse.json({ message: 'Logged in successfully', user: mappedUser });
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
