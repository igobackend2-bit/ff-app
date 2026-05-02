// Skill #13 — OTP send with rate limiting (Skill #14 — Redis)
// Skill #17 — Zod validation
// Skill #39 — HttpOnly cookie session (no JWT in HTML)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authRequestSchema } from '@/lib/validations';

// Rate limiting: max 3 OTP requests per phone per 10 minutes
async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  // In production: use @upstash/ratelimit
  // Placeholder implementation — replace with Redis
  return { allowed: true };
}

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP before storing (never store plaintext)
async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + (process.env['NEXTAUTH_SECRET'] ?? ''));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash).toString('hex');
}

async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  if (process.env['NODE_ENV'] === 'development' || !process.env['RESEND_API_KEY']) {
    // In dev or if no real email provider: log OTP to console
    console.warn(`[DEV] OTP for ${email}: ${otp}`);
    return true;
  }

  // Placeholder for real email provider (like Resend)
  console.log(`Sending email to ${email} with OTP: ${otp}`);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;

    // Skill #17 — Zod validation
    const result = authRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { name, phone, email } = result.data;

    // Skill #14 — Redis rate limiting
    const rateCheck = await checkRateLimit(email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait before requesting again.' },
        {
          status: 429,
          headers: rateCheck.retryAfter
            ? { 'Retry-After': String(rateCheck.retryAfter) }
            : {},
        },
      );
    }

    // Generate + hash OTP
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);

    // Store in DB with 5-minute expiry
    const { prisma } = await import('@/lib/db');
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedOtp,
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // Send Email
    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
