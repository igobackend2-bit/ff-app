import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const SB = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });

    const secret = process.env['RAZORPAY_KEY_SECRET'] ?? '';
    const generated = createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (generated !== razorpay_signature)
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });

    const res = await fetch(`${SB}/rest/v1/orders?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...sbH, Prefer: 'return=representation' },
      body: JSON.stringify({ status: 'CONFIRMED', payment_status: 'PAID', razorpay_payment_id, razorpay_signature }),
    });
    const rows: any[] = await res.json();
    return NextResponse.json({ success: true, orderNumber: rows[0]?.order_number });
  } catch (err) {
    console.error('[Order confirm]', err);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}
