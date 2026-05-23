// Skill #16 — Razorpay loaded dynamically at checkout ONLY
// Skill #39 — CSRF protection on payment mutation
// Skill #30 — All inputs have <label>

import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = {
  title: 'Checkout — Farmers Factory',
  description: 'Complete your grocery order with fast, secure checkout.',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6 md:px-6">
      {/* Skill #26 — ONE h1 */}
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
