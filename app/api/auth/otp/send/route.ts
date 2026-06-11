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

/** Send OTP via APITxT (DLT-approved, sender FFCTRY). */
async function sendViaApitxt(phone: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  const authkey  = process.env['APITXT_API_KEY']!;
  const sender   = process.env['APITXT_SENDER_ID'] ?? 'FFCTRY';
  const template = process.env['APITXT_OTP_TEMPLATE'] ?? 'Your Farmers Factory login OTP is {otp}. Valid for 5 minutes. Do not share it with anyone.';
  const message  = template.replace('{otp}', otp);
  const digits   = phone.replace(/^\+91/, '');

  const url = new URL('https://www.apitxt.com/api/sendMsg');
  url.searchParams.set('authkey', authkey);
  url.searchParams.set('mobiles', digits);
  url.searchParams.set('message', message);
  url.searchParams.set('sender', sender);
  url.searchParams.set('route', process.env['APITXT_ROUTE'] ?? '4');
  if (process.env['APITXT_TEMPLATE_ID']) url.searchParams.set('template_id', process.env['APITXT_TEMPLATE_ID']);
  if (process.env['APITXT_PE_ID'])       url.searchParams.set('pe_id', process.env['APITXT_PE_ID']);

  try {
    const res  = await fetch(url.toString(), { method: 'GET' });
    const text = await res.text();
    let data: { status?: string | boolean; message?: string } = {};
    try { data = JSON.parse(text) as typeof data; } catch { /* non-JSON response */ }

    const ok = res.ok && (data.status === 'success' || data.status === true || data.status === 'OK' || /success/i.test(text));
    if (!ok) {
      console.error('[OTP][APITxT]', res.status, text.slice(0, 300));
      return { ok: false, error: data.message ?? `APITxT HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[OTP][APITxT] Fetch error:', msg);
    return { ok: false, error: msg };
  }
}

/** Send OTP SMS — APITxT first (DLT-approved), Fast2SMS fallback, console in dev. */
async function sendSmsOtp(phone: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  if (process.env['APITXT_API_KEY']) {
    const result = await sendViaApitxt(phone, otp);
    if (result.ok) return result;
    // fall through to Fast2SMS if configured
  }

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

    // Persist hashed OTP in DB when available (best effort — stateless token below
    // keeps login working even when the database is unreachable)
    try {
      const hashedOtp = await hashOtp(otp);
      await prisma.verificationToken.deleteMany({ where: { identifier: phone } });
      await prisma.verificationToken.create({
        data: {
          identifier: phone,
          token:      hashedOtp,
          expires:    new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
      });
    } catch (dbErr) {
      console.warn('[OTP send] DB unavailable, relying on stateless token:', String(dbErr).slice(0, 200));
    }

    // Stateless signed token: HMAC(phone|otp|expires) — verified without DB
    const expires   = Date.now() + 5 * 60 * 1000;
    const sigInput  = `${phone}|${otp}|${expires}|${process.env['NEXTAUTH_SECRET'] ?? 'ff-dev-secret'}`;
    const sigHash   = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sigInput));
    const signature = Buffer.from(sigHash).toString('hex');
    const otpToken  = Buffer.from(`${phone}|${expires}|${signature}`).toString('base64url');

    // Deliver OTP via SMS
    const { ok, error } = await sendSmsOtp(phone, otp);

    if (!ok) {
      return NextResponse.json(
        { error: `Could not send OTP: ${error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'OTP sent to your mobile', smsSent: true, otpToken });
  } catch (error) {
    console.error('[OTP send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
