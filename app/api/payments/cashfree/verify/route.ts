// POST /api/payments/cashfree/verify   Body: { orderId }
// Asks Cashfree for the authoritative order status and writes it back to the
// Supabase order so /admin/orders reflects the real payment state.
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCashfreeOrder } from '@/lib/cashfree';

const SB_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'https://qwiumswrbddwmlraktvy.supabase.co';
const SB_KEY =
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ??
  '';

async function updateOrder(orderId: string, fields: Record<string, unknown>) {
  const res = await fetch(`${SB_URL}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(fields),
    cache: 'no-store',
  });
  if (!res.ok) console.warn('[cashfree/verify] order update failed:', res.status, (await res.text()).slice(0, 160));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const cf = await getCashfreeOrder(orderId);
    const status = (cf.order_status ?? '').toUpperCase();
    const paid   = status === 'PAID';

    await updateOrder(orderId, {
      payment_status: paid ? 'paid' : status === 'EXPIRED' || status === 'TERMINATED' ? 'failed' : 'unpaid',
      status:         paid ? 'CONFIRMED' : 'PLACED',
      payment_method: 'cashfree',
    });

    return NextResponse.json({ paid, status, orderId });
  } catch (err) {
    console.error('[POST /api/payments/cashfree/verify]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 502 },
    );
  }
}
