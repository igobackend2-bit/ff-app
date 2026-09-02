import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Your Account & Data | Farmers Factory',
  description:
    'How to request deletion of your Farmers Factory account and associated personal data.',
};

const STEPS = [
  'Open the Farmers Factory app and sign in with your registered mobile number.',
  'Go to Profile → Account → "Delete my account".',
  'Confirm the request. Your account is deactivated immediately and permanently deleted within 7 days.',
];

const DELETED = [
  'Your name and profile details',
  'Your registered mobile number',
  'Saved delivery addresses',
  'Wishlist and cart contents',
  'Back-in-stock alert subscriptions',
  'In-app notifications',
];

const RETAINED = [
  ['Order and invoice records', 'Retained for up to 8 years to meet Indian tax, accounting and FSSAI record-keeping obligations, then permanently deleted. These records are not used for any other purpose.'],
  ['Payment records', 'Held by our payment processor (Cashfree) under their own retention policy; Farmers Factory does not store card or bank details.'],
];

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Delete Your Account &amp; Data</h1>
        <p className="text-neutral-400">Farmers Factory — operated by IGO Precision Farming Pvt Ltd</p>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6 space-y-8">
        <p className="text-sm text-neutral-600 leading-relaxed">
          You can ask us to delete your Farmers Factory account and the personal
          data linked to it at any time. This page explains how to make the
          request, what gets deleted, and what we are legally required to keep.
        </p>

        <section>
          <h2 className="mb-3 font-black text-neutral-900">How to request deletion — in the app</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-600 leading-relaxed">
            {STEPS.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </section>

        <section>
          <h2 className="mb-3 font-black text-neutral-900">How to request deletion — by email</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            If you cannot access the app, email{' '}
            <a href="mailto:info.thefarmersfactory@gmail.com" className="font-semibold text-green-700 underline">
              info.thefarmersfactory@gmail.com
            </a>{' '}
            from the address on your account, or with the subject line
            &quot;Delete my account&quot; and your registered mobile number in the
            body. We verify ownership of the number, then process the deletion
            within 7 days and confirm by email.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-black text-neutral-900">What is deleted</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-neutral-600 leading-relaxed">
            {DELETED.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-black text-neutral-900">What is retained, and why</h2>
          <div className="space-y-3">
            {RETAINED.map(([t, b]) => (
              <div key={t}>
                <p className="text-sm font-bold text-neutral-900">{t}</p>
                <p className="text-sm text-neutral-600 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-black text-neutral-900">Contact</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            IGO Precision Farming Pvt Ltd, No 17, Kovalan Street, 2nd Main Road,
            Uthandi Kanathur, Chennai – 600119. Email:{' '}
            <a href="mailto:info.thefarmersfactory@gmail.com" className="font-semibold text-green-700 underline">
              info.thefarmersfactory@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
