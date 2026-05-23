import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify Razorpay signature
    const secret    = process.env['RAZORPAY_KEY_SECRET'] ?? '';
    const generated = createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Update order to CONFIRMED + PAID
    const order = await prisma.order.update({
      where: { id },
      data:  {
        status:            'CONFIRMED',
        paymentStatus:     'PAID',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (err) {
    console.error('[Order confirm]', err);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}
