// POST /api/contact — sends contact form submissions via Resend (Gmail SMTP creds are invalid in prod)
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const TO_EMAIL   = 'info.thefarmersfactory@gmail.com';
const FROM_EMAIL = 'Farmers Factory <contact@igogroup.in>';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string; email?: string; phone?: string; subject?: string; message?: string;
    };
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
    }

    const apiKey = process.env['RESEND_API_KEY'];
    if (!apiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      TO_EMAIL,
      replyTo: email,
      subject: `[Contact Form] ${subject || 'New message'} — from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || '—')}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject || '—')}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      `,
    });

    if (error) {
      console.error('[api/contact] Resend error', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/contact]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
