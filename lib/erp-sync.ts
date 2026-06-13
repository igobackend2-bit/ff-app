// Syncs customer orders to the ERP Supabase (qwiumswrbddwmlraktvy)
// Called server-side from /api/orders POST — works for both web and APK

const ERP_URL = 'https://qwiumswrbddwmlraktvy.supabase.co';
const ERP_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aXVtc3dyYmRkd21scmFrdHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjU3NTIsImV4cCI6MjA5NTcwMTc1Mn0.AsY045N7wHqMF_2P0-D2Ouzrkphjfkb4CP6ImhSm-tc';

const ERP_HEADERS = {
  apikey:         ERP_KEY,
  Authorization:  `Bearer ${ERP_KEY}`,
  'Content-Type': 'application/json',
  Prefer:         'return=representation',
};

export interface ERPOrderPayload {
  customerName:    string;
  deliveryAddress: string;
  totalAmount:     number;
  notes?:          string;
  items?: Array<{
    productId:   string;
    productName: string;
    quantity:    number;
    unitPrice:   number;
  }>;
}

export async function syncOrderToERP(payload: ERPOrderPayload): Promise<void> {
  try {
    const res = await fetch(`${ERP_URL}/rest/v1/sales_orders`, {
      method:  'POST',
      headers: ERP_HEADERS,
      body: JSON.stringify({
        customer_name:    payload.customerName,
        delivery_address: payload.deliveryAddress,
        total_amount:     payload.totalAmount,
        status:           'pending',
        source:           'app',
        notes:            payload.notes ?? null,
        created_at:       new Date().toISOString(),
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('[ERP sync] sales_orders insert failed:', await res.text().catch(() => res.statusText));
      return;
    }

    const rows: Array<{ id: string }> = await res.json();
    const salesOrderId = rows[0]?.id;

    // Sync line items if we have them and got an order ID
    if (salesOrderId && payload.items?.length) {
      await fetch(`${ERP_URL}/rest/v1/sales_order_items`, {
        method:  'POST',
        headers: ERP_HEADERS,
        body: JSON.stringify(
          payload.items.map((i) => ({
            sales_order_id: salesOrderId,
            product_id:     i.productId,
            product_name:   i.productName,
            quantity:       i.quantity,
            unit_price:     i.unitPrice,
            total:          i.unitPrice * i.quantity,
          })),
        ),
        cache: 'no-store',
      }).catch((e) => console.warn('[ERP sync] sales_order_items insert failed:', e));
    }
  } catch (e) {
    // Non-blocking — order is still saved in customer app even if ERP sync fails
    console.warn('[ERP sync] failed (non-blocking):', e);
  }
}
