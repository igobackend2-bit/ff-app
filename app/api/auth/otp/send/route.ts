import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number (+91XXXXXXXXXX)'),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOtp(otp: string): Promise<string> {
  const enc  = new TextEncoder();
  const data = enc.encode(otp + (process.env['NEXTAUTH_SECRET'] ?? 'ff-dev-secret'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

/** Send OTP via Fast2SMS (India). Falls back to console.log if API key not set. */
async function sendSmsOtp(phone: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env['FAST2SMS_API_KEY'];

  if (!apiKey) {
    // Development fallback — print OTP in server logs
    console.log(`[OTP][DEV] Phone: ${phone} | OTP: ${otp}`);
    return { ok: true };
  }

  // Strip to 10 digits (Fast2SMS expects plain number, no country code)
  const digits = phone.replace(/^\+91/, '');

  try {
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&variables_values=${otp}&route=otp&numbers=${digits}`;
    const res  = await fetch(url, { method: 'GET' });

    let data: { return?: boolean; message?: string[] } = {};
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      data = (await res.json()) as typeof data;
    }

    if (!data.return) {
      const msg = data.message?.[0] ?? `HTTP ${res.status}`;
      console.error('[OTP][Fast2SMS]', msg);
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[OTP][Fast2SMS] Fetch error:', msg);
    return { ok: false, error: msg };
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }

    const body   = (await req.json()) as unknown;
    const result = sendOtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const phone = result.data.phone;
    const otp   = generateOtp();

    // Persist hashed OTP — use phone as identifier
    const hashedOtp = await hashOtp(otp);
    await prisma.verificationToken.deleteMany({ where: { identifier: phone } });
    await prisma.verificationToken.create({
      data: {
        identifier: phone,
        token:      hashedOtp,
        expires:    new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // Deliver OTP via SMS
    const { ok, error } = await sendSmsOtp(phone, otp);

    if (!ok) {
      return NextResponse.json(
        { error: `Could not send OTP: ${error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'OTP sent to your mobile', smsSent: true });
  } catch (error) {
    console.error('[OTP send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
