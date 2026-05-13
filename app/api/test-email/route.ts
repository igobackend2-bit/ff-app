// TEMPORARY diagnostic route — delete after fixing email
// Visit: http://localhost:3000/api/test-email
import { NextResponse } from 'next/server';

export async function GET() {
  const gmailUser = process.env['GMAIL_USER'];
  const gmailPass = process.env['GMAIL_APP_PASSWORD']?.replace(/\s/g, '');
  const resendKey = process.env['RESEND_API_KEY'];

  const results: Record<string, unknown> = {
    env: {
      GMAIL_USER:         gmailUser ?? 'NOT SET',
      GMAIL_PASS_SET:     !!gmailPass,
      GMAIL_PASS_LENGTH:  gmailPass?.length ?? 0,
      RESEND_KEY_SET:     !!resendKey,
      RESEND_KEY_PREFIX:  resendKey?.slice(0, 8) ?? 'NOT SET',
    },
  };

  // ── Test Gmail ─────────────────────────────────────────────────────────────
  if (gmailUser && gmailPass) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const nodemailer = require('nodemailer') as any;
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: gmailUser, pass: gmailPass },
      });

      // verify only (no actual send)
      await transporter.verify();
      results['gmail'] = { status: 'OK', message: 'SMTP connection verified ✅' };
    } catch (err) {
      results['gmail'] = {
        status:  'FAILED',
        error:   err instanceof Error ? err.message : String(err),
        fix:     'Check 2FA is ON + App Password is correct at myaccount.google.com/apppasswords',
      };
    }
  } else {
    results['gmail'] = { status: 'SKIPPED', reason: 'GMAIL_USER or GMAIL_APP_PASSWORD not set' };
  }

  // ── Test Resend ────────────────────────────────────────────────────────────
  if (resendKey) {
    try {
      const res  = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${resendKey}` },
      });
      const data = await res.json() as { data?: unknown[]; name?: string; message?: string };

      if (res.ok) {
        results['resend'] = {
          status:  'OK',
          message: 'API key valid ✅',
          domains: data.data ?? [],
        };
      } else {
        results['resend'] = {
          status:  'FAILED',
          error:   `${data.name}: ${data.message}`,
          fix:     'Check RESEND_API_KEY is correct at resend.com/api-keys',
        };
      }
    } catch (err) {
      results['resend'] = {
        status: 'FAILED',
        error:  err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    results['resend'] = { status: 'SKIPPED', reason: 'RESEND_API_KEY not set' };
  }

  return NextResponse.json(results, { status: 200 });
}
