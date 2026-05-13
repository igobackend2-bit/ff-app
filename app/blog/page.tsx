
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog | Farmers Factory',
  description: 'Fresh tips, recipes, farmer stories, and health guides from the Farmers Factory team.',
};

const POSTS = [
  { slug:'farm-to-table', title:'Farm to Table: How Your Vegetables Travel 200 km in 12 Hours', cat:'Behind the Scenes', date:'May 8, 2026', read:'5 min', img:'/images/vegtables/Beans.jfif' },
  { slug:'seasonal-eating', title:'Why Seasonal Eating Saves You Money and Tastes Better', cat:'Health & Nutrition', date:'May 2, 2026', read:'4 min', img:'/images/vegtables/Broccoli.jfif' },
  { slug:'ooty-carrots', title:'Meet the Farmers Behind Ooty Carrots — The Sweetest in India', cat:'Farmer Stories', date:'Apr 24, 2026', read:'6 min', img:'/images/vegtables/carrot.jfif' },
  { slug:'store-vegetables', title:'10 Tips to Keep Your Vegetables Fresh for Longer', cat:'Kitchen Tips', date:'Apr 18, 2026', read:'3 min', img:'/images/vegtables/Cabbage.jfif' },
  { slug:'organic-vs-regular', title:'Organic vs. Regular: What the Labels Actually Mean', cat:'Health & Nutrition', date:'Apr 10, 2026', read:'5 min', img:'/images/vegtables/CapsicumGreen.jfif' },
  { slug:'onion-price', title:'Why Onion Prices Spike Every Summer — Explained Simply', cat:'Market Watch', date:'Apr 1, 2026', read:'4 min', img:'/images/vegtables/OnionNasik.jfif' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black md:text-4xl">The Fresh Feed</h1>
        <p className="text-neutral-400">Stories, recipes, and insights from the world of fresh food.</p>
      </div>

      <div className="mx-auto max-w-screen-lg px-4 py-12 md:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <article key={post.slug} className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-44 w-full overflow-hidden bg-neutral-100">
                <img src={post.img} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <div className="p-4">
                <span className="mb-2 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">{post.cat}</span>
                <h2 className="mb-2 text-sm font-black leading-snug text-neutral-900 group-hover:text-emerald-700 transition-colors">{post.title}</h2>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.read} read</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-emerald-50 p-6 text-center">
          <p className="font-bold text-neutral-800">Get fresh articles in your inbox</p>
          <p className="mt-1 text-sm text-neutral-500">Weekly tips on nutrition, recipes, and what's in season.</p>
          <div className="mt-4 flex gap-2 max-w-sm mx-auto">
            <input className="flex-1 h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="your@email.com" type="email" />
            <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
}
