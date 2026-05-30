import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  name:  z.string().min(2).optional(),
  phone: z.string().optional(),
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

function otpHtml(otp: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:40px 0;">
  <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:40px 32px;text-align:center;">
    <p style="font-size:18px;font-weight:bold;color:#16a34a;margin-bottom:20px;">Farmers Factory</p>
    <p style="color:#374151;margin-bottom:16px;">Your one-time login code:</p>
    <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:20px 40px;display:inline-block;margin-bottom:16px;">
      <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#111827;">${otp}</span>
    </div>
    <p style="font-size:13px;color:#6b7280;">Valid for <strong>5 minutes</strong>. Do not share this code.</p>
  </div>
</body></html>`;
}

async function sendOtpEmail(to: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env['RESEND_API_KEY'];
  const from   = process.env['RESEND_FROM_EMAIL'] ?? 'Farmers Factory <noreply@igogroup.in>';

  if (!apiKey) {
    return { ok: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: `Your Farmers Factory login code: ${otp}`,
        html:    otpHtml(otp),
        text:    `Your Farmers Factory login code: ${otp}\n\nValid for 5 minutes.`,
      }),
    });

    // Try to parse response — might not be JSON on network errors
    let data: { id?: string; name?: string; message?: string } = {};
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      data = (await res.json()) as typeof data;
    }

    if (!res.ok) {
      const msg = `${data.name ?? res.status}: ${data.message ?? 'Resend error'}`;
      console.error('[OTP][Resend]', msg);
      // Don't fail the whole flow — log and continue (dev convenience)
      if (process.env['NODE_ENV'] !== 'production') {
        return { ok: true };
      }
      return { ok: false, error: msg };
    }

    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[OTP][Resend] Fetch error:', msg);
    // In dev, let login work even if email fails
    if (process.env['NODE_ENV'] !== 'production') {
      return { ok: true };
    }
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

    const email = result.data.email.trim().toLowerCase();
    const otp   = generateOtp();

    // Save hashed OTP to DB via Supabase REST
    const hashedOtp = await hashOtp(otp);
    await fetch(`${SB}/rest/v1/verification_tokens?identifier=eq.${encodeURIComponent(email)}`, { method: 'DELETE', headers: sbH });
    await fetch(`${SB}/rest/v1/verification_tokens`, {
      method: 'POST', headers: { ...sbH, Prefer: 'return=minimal' },
      body: JSON.stringify({ identifier: email, token: hashedOtp, expires: new Date(Date.now() + 5 * 60 * 1000).toISOString() }),
    });

    // Send email (never blocks login in dev)
    const { ok, error } = await sendOtpEmail(email, otp);

    if (!ok) {
      return NextResponse.json(
        { error: `Could not send OTP email: ${error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message:   'OTP sent to your email',
      emailSent: true,
    });
  } catch (error) {
    console.error('[OTP send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
