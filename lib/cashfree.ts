// Cashfree Payment Gateway (PG) — server-side helper.
// Docs: https://docs.cashfree.com/reference/pg-new-apis-endpoint
// Credentials come from env; sandbox by default.

const ENV       = process.env['CASHFREE_ENV'] === 'production' ? 'production' : 'sandbox';
const BASE      = ENV === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
const APP_ID    = process.env['CASHFREE_APP_ID'] ?? '';
const SECRET    = process.env['CASHFREE_SECRET_KEY'] ?? '';
const API_VER   = '2023-08-01';

export const cashfreeConfigured = Boolean(APP_ID && SECRET);
export const cashfreeMode: 'sandbox' | 'production' = ENV;

function headers(): Record<string, string> {
  return {
    'Content-Type':   'application/json',
    'x-api-version':  API_VER,
    'x-client-id':    APP_ID,
    'x-client-secret': SECRET,
  };
}

export interface CreateOrderInput {
  orderId: string;          // our Supabase order id — used as Cashfree order_id
  amount: number;           // rupees
  customerName: string;
  customerPhone: string;    // any format; digits are extracted
  returnUrl: string;        // Cashfree appends ?order_id={order_id}
}

export interface CashfreeOrder {
  payment_session_id?: string;
  order_id?: string;
  order_status?: string;    // ACTIVE | PAID | EXPIRED | TERMINATED
  order_amount?: number;
  message?: string;
  type?: string;
}

export async function createCashfreeOrder(input: CreateOrderInput): Promise<CashfreeOrder> {
  const phone10 = input.customerPhone.replace(/\D/g, '').slice(-10);
  const res = await fetch(`${BASE}/pg/orders`, {
    method: 'POST',
    headers: headers(),
    cache: 'no-store',
    body: JSON.stringify({
      order_id:       input.orderId,
      order_amount:   Number(input.amount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id:    phone10 || `guest_${Date.now()}`,
        customer_phone: phone10 || '9999999999',
        customer_name:  input.customerName || 'Customer',
      },
      order_meta: { return_url: `${input.returnUrl}?order_id={order_id}` },
    }),
  });
  const data = (await res.json()) as CashfreeOrder;
  if (!res.ok || !data.payment_session_id) {
    throw new Error(data.message ?? `Cashfree create-order failed (${res.status})`);
  }
  return data;
}

export async function getCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  const res = await fetch(`${BASE}/pg/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: headers(),
    cache: 'no-store',
  });
  const data = (await res.json()) as CashfreeOrder;
  if (!res.ok) throw new Error(data.message ?? `Cashfree get-order failed (${res.status})`);
  return data;
}
