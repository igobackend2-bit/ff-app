
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press & Media | Farmers Factory',
  description: 'Press releases, media coverage, and brand assets for Farmers Factory.',
};

const COVERAGE = [
  { outlet:'The Economic Times', headline:'Farmers Factory raises Rs 45 Cr in Series A to expand to 20 cities', date:'March 2026' },
  { outlet:'YourStory', headline:'How this Bangalore startup is giving vegetable farmers a fair deal', date:'January 2026' },
  { outlet:'Inc42', headline:'Farmers Factory clocks 3x growth in tier-2 cities in FY25', date:'November 2025' },
  { outlet:'Business Standard', headline:'Farm-to-home startup Farmers Factory launches same-day delivery in Chennai', date:'September 2025' },
  { outlet:'Mint', headline:'Fresh produce startup Farmers Factory crosses 50,000 daily orders', date:'July 2025' },
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Press & Media</h1>
        <p className="text-neutral-400">News, coverage, and resources for journalists and media partners.</p>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">

        {/* Contact */}
        <div className="mb-10 rounded-2xl border border-neutral-100 bg-neutral-50 p-6">
          <h2 className="mb-1 font-black text-neutral-900">Media Enquiries</h2>
          <p className="mb-3 text-sm text-neutral-600">For interviews, press releases, and brand assets, contact our communications team.</p>
          <a href="mailto:press@farmersfactory.in" className="font-bold text-emerald-600 hover:underline">press@farmersfactory.in</a>
        </div>

        {/* Coverage */}
        <h2 className="mb-4 text-xl font-black text-neutral-900">In the News</h2>
        <div className="space-y-3">
          {COVERAGE.map((item) => (
            <div key={item.headline} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{item.outlet}</span>
                <span className="text-xs text-neutral-400">{item.date}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-800">{item.headline}</p>
            </div>
          ))}
        </div>

        {/* Assets */}
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-200 p-6 text-center">
          <h2 className="mb-2 font-black text-neutral-900">Brand Assets</h2>
          <p className="mb-3 text-sm text-neutral-500">Download our logo, brand guidelines, and founder photos.</p>
          <a href="mailto:press@farmersfactory.in?subject=Brand Assets Request"
            className="inline-block rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 transition-colors">
            Request Press Kit
          </a>
        </div>
      </div>
    </div>
  );
}
