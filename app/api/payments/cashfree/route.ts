// POST /api/payments/cashfree
// Body: { orderId, amount, customerName, customerPhone }
// Creates a Cashfree order for an already-created Supabase order and returns
// the payment_session_id the client SDK needs to open checkout.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createCashfreeOrder, cashfreeConfigured, cashfreeMode } from '@/lib/cashfree';

const schema = z.object({
  orderId:       z.string().min(1),
  amount:        z.number().positive(),
  customerName:  z.string().min(1),
  customerPhone: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    if (!cashfreeConfigured) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
    }
    const { orderId, amount, customerName, customerPhone } = parsed.data;

    const origin = req.nextUrl.origin;
    const cf = await createCashfreeOrder({
      orderId,
      amount,
      customerName,
      customerPhone,
      returnUrl: `${origin}/checkout/success`,
    });

    return NextResponse.json({
      paymentSessionId: cf.payment_session_id,
      cfOrderId:        cf.order_id,
      mode:             cashfreeMode,
      orderId,
    });
  } catch (err) {
    console.error('[POST /api/payments/cashfree]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start payment' },
      { status: 502 },
    );
  }
}
