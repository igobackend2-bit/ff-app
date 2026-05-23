
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MessageCircle, HelpCircle, Package, RefreshCw, MapPin, CreditCard } from 'lucide-react';

const QUICK_LINKS = [
  { icon: Package,      label: 'Track my order',         href: '/account/orders',  color: 'bg-orange-50 text-orange-600' },
  { icon: RefreshCw,    label: 'Return or refund',        href: '/returns',         color: 'bg-red-50 text-red-600' },
  { icon: MapPin,       label: 'Change delivery address', href: '/account/addresses', color: 'bg-blue-50 text-blue-600' },
  { icon: CreditCard,   label: 'Payment issues',          href: '/help#payments',   color: 'bg-purple-50 text-purple-600' },
  { icon: HelpCircle,   label: 'FAQ',                     href: '/help',            color: 'bg-emerald-50 text-emerald-600' },
  { icon: MessageCircle,label: 'Send feedback',           href: '/contact',         color: 'bg-yellow-50 text-yellow-600' },
];

export default function SupportPage() {
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([
    { from: 'bot', text: 'Hi there! I am the Farmers Factory support assistant. How can I help you today?' },
  ]);
  const [sending, setSending] = useState(false);

  const AUTO_REPLIES: Record<string, string> = {
    'order': 'You can track your order under My Account > Orders. If you have an issue, tap "Report" on the order.',
    'refund': 'Refunds are processed within 2-3 business days. For fresh produce, report an issue within 24 hours of delivery.',
    'delivery': 'We deliver 7 days a week from 6 AM to 10 PM. Express 3-hour slots are available in select areas.',
    'cancel': 'Orders can be cancelled within 30 minutes of placing. Go to My Orders and tap Cancel.',
    'address': 'You can add or edit addresses under My Account > Saved Addresses.',
    'payment': 'We accept UPI, credit/debit cards, net banking, and Cash on Delivery up to Rs. 2,000.',
    'quality': 'If you received a damaged or poor-quality product, tap "Report Issue" on your order within 24 hours.',
    'contact': 'Call us at +91 80000 00000 or email support@farmersfactory.in — we are available 8 AM to 10 PM every day.',
  };

  const handleSend = () => {
    const text = chat.trim();
    if (!text) return;
    const msgs = [...messages, { from: 'user', text }];
    setMessages(msgs);
    setChat('');
    setSending(true);
    setTimeout(() => {
      const lower = text.toLowerCase();
      const key = Object.keys(AUTO_REPLIES).find(k => lower.includes(k));
      const reply = key
        ? AUTO_REPLIES[key]
        : 'Thanks for reaching out! For this query, please contact us at support@farmersfactory.in or call +91 80000 00000.';
      setMessages(prev => [...prev, { from: 'bot', text: reply ?? '' }]);
      setSending(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="bg-emerald-600 px-4 py-12 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Support</h1>
        <p className="text-emerald-100">We are here to help — 7 days a week, 8 AM to 10 PM.</p>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-10 md:px-6 space-y-8">

        {/* Quick links */}
        <section>
          <h2 className="mb-4 font-black text-neutral-900">What do you need help with?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_LINKS.map(({ icon: Icon, label, href, color }) => (
              <Link key={label} href={href}
                className="flex items-center gap-2.5 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color.split(' ')[0]}`}>
                  <Icon className={`h-4 w-4 ${color.split(' ')[1]}`} />
                </div>
                <span className="text-xs font-bold text-neutral-800 leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Chat widget */}
        <section>
          <h2 className="mb-4 font-black text-neutral-900">Chat with Us</h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.from === 'user' ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-800'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-neutral-100 px-4 py-3">
                    {[0,1,2].map(i => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: `${i*0.15}s` }} />)}
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="flex gap-2 border-t border-neutral-100 p-3">
              <input
                className="flex-1 h-10 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Type your question..."
                value={chat}
                onChange={e => setChat(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              />
              <button onClick={handleSend}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
                Send
              </button>
            </div>
          </div>
        </section>

        {/* Direct contact */}
        <section>
          <h2 className="mb-4 font-black text-neutral-900">Contact Us Directly</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="tel:+918000000000"
              className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm hover:border-emerald-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Phone className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Call / WhatsApp</p>
                <p className="font-bold text-neutral-900">+91 80000 00000</p>
              </div>
            </a>
            <a href="mailto:support@farmersfactory.in"
              className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm hover:border-emerald-200 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Email</p>
                <p className="font-bold text-neutral-900">support@farmersfactory.in</p>
              </div>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
