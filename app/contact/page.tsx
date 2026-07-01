
'use client';
import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
    } catch {
      setError('Could not send your message. Please try again or contact us directly.');
    } finally {
      setSending(false);
    }
  };

  const inp = 'h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100';

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="bg-emerald-600 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Contact Us</h1>
        <p className="text-emerald-100">We would love to hear from you. Reach us any way you prefer.</p>
      </div>

      <div className="mx-auto max-w-screen-lg px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">

          {/* Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-neutral-900">Get in Touch</h2>
            {[
              { icon: Phone, label: 'Phone / WhatsApp', value: '+91 89258 78327', href: 'tel:+918925878327' },
              { icon: Mail, label: 'Email Support', value: 'info.thefarmersfactory@gmail.com', href: 'mailto:info.thefarmersfactory@gmail.com' },
              { icon: MapPin, label: 'Head Office', value: 'No 17, Kovalan Street, 2nd Main Road, Uthandi Kanathur, Chennai – 600119', href: null },
              { icon: Clock, label: 'Support Hours', value: 'Monday – Sunday: 8 AM – 10 PM IST', href: null },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Icon className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm font-semibold text-neutral-800 hover:text-emerald-600 transition-colors">{value}</a>
                  ) : (
                    <p className="text-sm font-semibold text-neutral-800">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <Send className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="mb-1 font-black text-neutral-900">Message Sent!</h2>
                <p className="text-sm text-neutral-500">We will get back to you within 2 business hours.</p>
              </div>
            ) : (
              <>
                <h2 className="mb-4 font-black text-neutral-900">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-neutral-500">Name *</label>
                      <input className={inp} required placeholder="Your name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-neutral-500">Phone</label>
                      <input className={inp} placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-neutral-500">Email *</label>
                    <input className={inp} required type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-neutral-500">Subject</label>
                    <input className={inp} placeholder="Order issue, feedback, partnership..." value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-neutral-500">Message *</label>
                    <textarea required rows={4} placeholder="Tell us how we can help..." value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none" />
                  </div>
                  {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                  <button type="submit" disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60">
                    <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
