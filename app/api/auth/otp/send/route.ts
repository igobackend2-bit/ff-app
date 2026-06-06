import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SB  = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const sendOtpSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name:  z.string().min(2).optional(),
}).refine(
  (d) => d.email || d.phone,
  { message: 'email or phone is required' },
);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashOtp(otp: string): Promise<string> {
  const enc  = new TextEncoder();
  const data = enc.encode(otp + (process.env['NEXTAUTH_SECRET'] ?? 'ff-dev-secret'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

// ── Email OTP (Resend) ────────────────────────────────────────────────────────
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
  if (!apiKey) return { ok: true };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to,
        subject: `Your Farmers Factory login code: ${otp}`,
        html: otpHtml(otp),
        text: `Your Farmers Factory login code: ${otp}\n\nValid for 5 minutes.`,
      }),
    });
    const ct   = res.headers.get('content-type') ?? '';
    const data = ct.includes('application/json')
      ? (await res.json()) as { id?: string; name?: string; message?: string }
      : {};
    if (!res.ok) {
      const msg = `${(data as any).name ?? res.status}: ${(data as any).message ?? 'Resend error'}`;
      if (process.env['NODE_ENV'] !== 'production') return { ok: true };
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (err) {
    if (process.env['NODE_ENV'] !== 'production') return { ok: true };
    return { ok: false, error: err instanceof Error ? err.message : 'Email failed' };
  }
}

// ── SMS OTP (APITxT) ─────────────────────────────────────────────────────────
// API ref: https://www.apitxt.com/apiDoc/sendSMS
// Endpoint: GET https://www.apitxt.com/api/sendMsg
// Params:   authkey, mobiles, message, sender, route, flash, unicode
async function sendOtpSms(phone: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey   = process.env['APITXT_API_KEY'];
  const senderId = process.env['APITXT_SENDER_ID'] ?? 'FFCTRY';

  if (!apiKey || apiKey === 'your_apitxt_api_key_here') {
    console.log(`[OTP SMS] Phone: ${phone}  OTP: ${otp}  (APITXT_API_KEY not set — dev mode)`);
    return { ok: true };
  }

  // Normalise: remove + so it becomes 91XXXXXXXXXX
  const mobile  = phone.replace(/^\+/, '');
  const message = `${otp} is your Farmers Factory OTP. Valid for 5 mins. Do not share. -FFCTRY`;

  const templateId = process.env['APITXT_TEMPLATE_ID'] ?? '';
  const peId       = process.env['APITXT_PE_ID'] ?? '';

  const params = new URLSearchParams({
    authkey: apiKey,
    mobiles: mobile,
    message,
    sender:  senderId,
    route:   '4',     // 4 = transactional (OTP)
    flash:   '0',
    unicode: '0',
    ...(templateId && { template_id: templateId }),
    ...(peId       && { pe_id: peId }),
  });

  try {
    const url = `https://www.apitxt.com/api/sendMsg?${params.toString()}`;
    const res  = await fetch(url, { method: 'GET' });
    const text = await res.text();

    console.log('[OTP SMS] APITxT response:', text);

    // Check for error in response
    try {
      const json = JSON.parse(text) as { status?: string; message?: string };
      if (json.status === 'error') {
        // Missing DLT registration — guide user
        if (text.includes('template_id') || text.includes('pe_id')) {
          return {
            ok: false,
            error: 'SMS provider needs DLT registration. Please add APITXT_TEMPLATE_ID and APITXT_PE_ID to your environment variables. Get these from your APITxT dashboard → DLT Registration.',
          };
        }
        return { ok: false, error: json.message ?? text };
      }
    } catch { /* not JSON — check raw text */ }

    if (!res.ok || text.toLowerCase().startsWith('error') || text.toLowerCase().includes('"status":"error"')) {
      return { ok: false, error: `SMS failed: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    console.error('[OTP SMS] Fetch error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'SMS send failed' };
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') ?? '';
    if (!ct.includes('application/json'))
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });

    const body   = (await req.json()) as unknown;
    const result = sendOtpSchema.safeParse(body);

    if (!result.success)
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );

    const { email, name, phone } = result.data;
    const otp        = generateOtp();
    const hashedOtp  = await hashOtp(otp);

    // Identifier: phone takes priority if provided
    const identifier = phone
      ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`)
      : email!.trim().toLowerCase();

    // Store hashed OTP
    await fetch(`${SB}/rest/v1/verification_tokens?identifier=eq.${encodeURIComponent(identifier)}`, {
      method: 'DELETE', headers: sbH,
    });
    await fetch(`${SB}/rest/v1/verification_tokens`, {
      method: 'POST',
      headers: { ...sbH, Prefer: 'return=minimal' },
      body: JSON.stringify({
        identifier,
        token:   hashedOtp,
        expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }),
    });

    // Send OTP via appropriate channel
    let sendResult: { ok: boolean; error?: string };
    if (phone) {
      sendResult = await sendOtpSms(identifier, otp);
    } else {
      sendResult = await sendOtpEmail(email!.trim().toLowerCase(), otp);
    }

    if (!sendResult.ok)
      return NextResponse.json({ error: sendResult.error ?? 'Failed to send OTP' }, { status: 500 });

    return NextResponse.json({
      message:  phone ? 'OTP sent to your phone via SMS' : 'OTP sent to your email',
      smsSent:  !!phone,
      emailSent: !phone,
    });
  } catch (error) {
    console.error('[OTP send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
