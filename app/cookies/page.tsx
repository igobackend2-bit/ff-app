
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Farmers Factory',
  description: 'How Farmers Factory uses cookies and similar tracking technologies.',
};

const COOKIES = [
  { name: 'ff_auth', type: 'Essential', duration: 'Session', purpose: 'Keeps you logged in during your session.' },
  { name: 'ff_cart', type: 'Functional', duration: '30 days', purpose: 'Remembers your cart items between sessions.' },
  { name: 'ff_loc', type: 'Functional', duration: '7 days', purpose: 'Saves your delivery location preference.' },
  { name: '_ga, _gid', type: 'Analytics', duration: '2 years / 24 hrs', purpose: 'Google Analytics — counts visits and page views (anonymised).' },
  { name: 'rzp_*', type: 'Functional', duration: 'Session', purpose: 'Razorpay payment gateway session management.' },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Cookie Policy</h1>
        <p className="text-neutral-400">Last updated: May 2026.</p>
      </div>
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6 space-y-8">
        <p className="text-sm text-neutral-600 leading-relaxed">
          This policy explains how Farmers Factory Technologies Pvt. Ltd. uses cookies and similar technologies on our website and app. By using our services, you consent to the use of cookies as described below.
        </p>

        <section>
          <h2 className="mb-2 font-black text-neutral-900">What Are Cookies?</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and actions over time, so you do not have to re-enter them each visit.</p>
        </section>

        <section>
          <h2 className="mb-4 font-black text-neutral-900">Cookies We Use</h2>
          <div className="overflow-x-auto rounded-2xl border border-neutral-100">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  {["Cookie Name","Type","Duration","Purpose"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {COOKIES.map(c => (
                  <tr key={c.name}>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-800">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.type === 'Essential' ? 'bg-emerald-50 text-emerald-700' : c.type === 'Analytics' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{c.type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{c.duration}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{c.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-black text-neutral-900">How to Control Cookies</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">You can control and delete cookies through your browser settings. Disabling essential cookies may affect your ability to log in or complete purchases. For instructions, visit your browser's help pages (Chrome, Safari, Firefox, Edge).</p>
        </section>

        <section>
          <h2 className="mb-2 font-black text-neutral-900">Contact</h2>
          <p className="text-sm text-neutral-600">For questions about our use of cookies, contact <a href="mailto:privacy@farmersfactory.in" className="text-emerald-600 hover:underline">privacy@farmersfactory.in</a>.</p>
        </section>
      </div>
    </div>
  );
}
