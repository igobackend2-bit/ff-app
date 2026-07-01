
import type { Metadata } from 'next';
import Link from 'next/link';
import { Package, CreditCard, MapPin, RefreshCw, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help Center | Farmers Factory',
  description: 'Frequently asked questions and support for Farmers Factory customers.',
};

const FAQS = [
  {
    section: 'Orders & Delivery',
    icon: Package,
    color: 'bg-orange-50 text-orange-600',
    items: [
      { q: 'What are your delivery timings?', a: 'We deliver 7 days a week, from 6 AM to 10 PM. Express slots (within 3 hours) are available in select areas.' },
      { q: 'What is the minimum order value?', a: 'The minimum order value is Rs. 149. Orders above Rs. 499 get free delivery.' },
      { q: 'Can I schedule a delivery for a specific time?', a: 'Yes! At checkout you can select a delivery slot up to 2 days in advance.' },
      { q: 'How do I track my order?', a: 'Once your order is dispatched, you will receive an SMS with a live tracking link. You can also track under My Orders in the app.' },
    ],
  },
  {
    section: 'Payments',
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-600',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI (GPay, PhonePe, Paytm), credit/debit cards, net banking, wallets, and Cash on Delivery.' },
      { q: 'Is Cash on Delivery available?', a: 'Yes, COD is available for orders up to Rs. 2,000 in most serviceable areas.' },
      { q: 'When will my refund be processed?', a: 'Refunds are processed within 2-3 business days back to your original payment method.' },
    ],
  },
  {
    section: 'Address & Location',
    icon: MapPin,
    color: 'bg-emerald-50 text-emerald-600',
    items: [
      { q: 'Which cities do you deliver to?', a: 'We currently deliver in Bangalore, Chennai, Mumbai, Pune, Hyderabad, Delhi-NCR, Kolkata, Ahmedabad, Jaipur, Kochi, Coimbatore, and Indore.' },
      { q: 'Can I change my delivery address after placing an order?', a: 'Address changes are possible up to 30 minutes after placing the order. Contact support immediately.' },
      { q: 'How do I add a new address?', a: 'Go to My Account > Saved Addresses > Add New. You can use GPS auto-fill for quick entry.' },
    ],
  },
  {
    section: 'Returns & Quality',
    icon: RefreshCw,
    color: 'bg-red-50 text-red-600',
    items: [
      { q: 'What if I receive a damaged or poor-quality product?', a: 'We offer a 100% quality guarantee. Click "Report Issue" on your order within 24 hours and we will refund or replace immediately.' },
      { q: 'How do I return a product?', a: 'Most fresh produce returns are pickup-free — we will simply credit your account or refund. For packaged goods, our delivery agent picks up during the next order.' },
      { q: 'What is your freshness guarantee?', a: 'All vegetables and fruits come with a minimum 2-day freshness guarantee from delivery date. If they wilt sooner, we will refund.' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <div className="bg-emerald-600 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Help Center</h1>
        <p className="text-emerald-100">Find answers to the most common questions below.</p>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-10 md:px-6 space-y-8">

        {FAQS.map(({ section, icon: Icon, color, items }) => (
          <div key={section} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-50 px-5 py-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color.split(' ')[0]}`}>
                <Icon className={`h-4 w-4 ${color.split(' ')[1]}`} />
              </div>
              <h2 className="font-black text-neutral-900">{section}</h2>
            </div>
            <div className="divide-y divide-neutral-50">
              {items.map(({ q, a }) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-neutral-800 marker:hidden list-none">
                    {q}
                    <span className="ml-3 shrink-0 text-neutral-400 group-open:rotate-45 transition-transform text-lg">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}

        {/* Still need help */}
        <div className="rounded-2xl bg-emerald-600 p-6 text-center text-white">
          <h2 className="mb-1 font-black text-lg">Still need help?</h2>
          <p className="mb-4 text-sm text-emerald-100">Our support team is available 7 days a week, 8 AM – 10 PM.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+918925878327" className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors">
              <Phone className="h-4 w-4" /> +91 89258 78327
            </a>
            <a href="mailto:info.thefarmersfactory@gmail.com" className="flex items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/30 transition-colors">
              <Mail className="h-4 w-4" /> info.thefarmersfactory@gmail.com
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
