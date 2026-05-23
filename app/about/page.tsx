
import type { Metadata } from 'next';
import Link from 'next/link';
import { Leaf, Truck, ShieldCheck, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Farmers Factory',
  description: 'Learn about Farmers Factory — fresh groceries delivered from farm to your door in 24 hours across India.',
};

const PILLARS = [
  { icon: Leaf,        title: 'Farm Fresh',       desc: 'We source directly from 500+ verified farmers across India. No cold-storage delays, no middlemen.' },
  { icon: Truck,       title: '24-Hour Delivery',  desc: 'Order by midnight, get it by tomorrow morning. We deliver 7 days a week including public holidays.' },
  { icon: ShieldCheck, title: 'Quality Assured',   desc: 'Every product passes our 3-point quality check — grade, freshness, and hygiene — before it reaches you.' },
  { icon: Users,       title: 'Farmer First',      desc: 'We pay farmers 30% more than the mandi price by cutting out the supply chain middlemen.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-emerald-600 px-4 py-16 text-center text-white">
        <h1 className="mb-3 text-3xl font-black md:text-5xl">From Farm to Your Door</h1>
        <p className="mx-auto max-w-xl text-lg text-emerald-100">
          Farmers Factory connects Indian farmers directly with urban households — cutting waste, boosting farmer income, and delivering fresher produce to you.
        </p>
      </div>

      <div className="mx-auto max-w-screen-lg px-4 py-12 md:px-6">

        {/* Mission */}
        <section className="mb-14 text-center">
          <span className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">Our Mission</span>
          <h2 className="mb-4 text-2xl font-black text-neutral-900 md:text-3xl">Make fresh food accessible to every Indian household</h2>
          <p className="mx-auto max-w-2xl text-neutral-600">
            Founded in 2024, Farmers Factory started with a simple idea: the vegetables in your kitchen should be harvested within 48 hours — not sitting in a cold-store for weeks. Today we serve 50,000+ families across 12 cities with over 800 SKUs of fresh produce, dairy, grains, and staples.
          </p>
        </section>

        {/* 4 pillars */}
        <section className="mb-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                <Icon className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="mb-1.5 font-black text-neutral-900">{title}</h3>
              <p className="text-sm text-neutral-600">{desc}</p>
            </div>
          ))}
        </section>

        {/* Stats */}
        <section className="mb-14 rounded-3xl bg-emerald-600 p-8 text-center text-white">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[['50K+','Families Served'],['500+','Partner Farmers'],['12','Cities'],['800+','Products']].map(([n,l]) => (
              <div key={l}>
                <p className="text-3xl font-black">{n}</p>
                <p className="mt-1 text-sm text-emerald-200">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="mb-3 text-xl font-black text-neutral-900">Ready to shop fresh?</h2>
          <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 transition-colors">
            Shop Now
          </Link>
        </section>
      </div>
    </div>
  );
}
