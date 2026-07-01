
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Farmers Factory',
  description: 'Farmers Factory 100% quality guarantee, return and refund policy.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Return & Refund Policy</h1>
        <p className="text-neutral-400">We stand behind every product we deliver. Last updated: May 2026.</p>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6 space-y-8">

        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
          <h2 className="mb-2 font-black text-emerald-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> 100% Quality Guarantee
          </h2>
          <p className="text-sm text-emerald-700">If you receive a product that is damaged, spoiled, or not as described, we will refund or replace it — no questions asked. Report within 24 hours of delivery.</p>
        </div>

        {[
          { title: '1. Eligibility for Returns', body: 'Fresh produce, dairy, and bakery items are eligible for a refund if reported within 24 hours of delivery. Packaged goods (FMCG) are eligible within 48 hours if the seal is unbroken and the product is unused. Items marked "Non-Returnable" on the product page cannot be returned.' },
          { title: '2. How to Report an Issue', body: 'Open the app, go to My Orders, tap on the order, and click "Report an Issue". Attach a photo if possible. You will receive a response within 2 hours during business hours (8 AM – 10 PM).' },
          { title: '3. Refund Process', body: 'Approved refunds are credited within 2–3 business days to the original payment method. UPI and wallet refunds are typically instant. COD orders receive a refund to your Farmers Factory wallet for use on the next order (or bank transfer on request).' },
          { title: '4. Replacements', body: 'For quality issues on fresh produce, we will send a replacement with your next order at no extra delivery charge. You can also opt for a full refund instead.' },
          { title: '5. Non-Refundable Items', body: 'Products that have been consumed or significantly used, items marked "Final Sale", and incorrect orders placed by the customer (wrong item selected) are not eligible for return.' },
          { title: '6. Contact Us', body: 'For any return-related queries, contact us at info.thefarmersfactory@gmail.com or call +91 89258 78327 (8 AM – 10 PM, 7 days a week).' },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="mb-2 font-black text-neutral-900">{title}</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{body}</p>
          </section>
        ))}

        <div className="text-center">
          <Link href="/help" className="text-sm font-bold text-emerald-600 hover:underline">Back to Help Center</Link>
        </div>
      </div>
    </div>
  );
}
