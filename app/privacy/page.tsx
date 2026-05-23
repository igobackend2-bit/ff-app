
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Farmers Factory',
  description: 'How Farmers Factory collects, uses, and protects your personal data.',
};

const SECTIONS = [
  { title: '1. Information We Collect', body: 'We collect information you provide directly: name, phone number, email address, and delivery addresses. We also collect usage data such as pages visited, products viewed, and orders placed. Location data is collected only when you grant permission and is used solely to show delivery availability and address suggestions.' },
  { title: '2. How We Use Your Information', body: 'Your information is used to: process and deliver your orders, send order updates via SMS and email, personalise product recommendations, improve our services, and comply with legal obligations. We do not sell your personal data to third parties.' },
  { title: '3. Data Sharing', body: 'We share your delivery address and phone number with our delivery partners solely for the purpose of delivering your order. Payment data is processed by PCI-DSS compliant payment gateways (Razorpay) and is never stored on our servers.' },
  { title: '4. Cookies', body: 'We use cookies to keep you logged in, remember your cart, and analyse site traffic. You can disable cookies in your browser settings but some features may not function correctly. See our Cookie Policy for details.' },
  { title: '5. Data Retention', body: 'We retain your account data for as long as your account is active or as needed to provide services. You may request deletion of your account and data at any time by emailing privacy@farmersfactory.in.' },
  { title: '6. Your Rights', body: 'Under the Digital Personal Data Protection Act, 2023 (India), you have the right to access, correct, and erase your personal data. To exercise these rights, email privacy@farmersfactory.in. We will respond within 30 days.' },
  { title: "7. Children's Privacy", body: 'Our services are not directed to children under 13. We do not knowingly collect personal data from children. If you believe we have inadvertently collected such data, please contact us immediately.' },
  { title: '8. Security', body: 'We implement industry-standard security measures including HTTPS, encrypted storage, and access controls. Despite best efforts, no transmission over the Internet is 100% secure.' },
  { title: '9. Changes to This Policy', body: 'We may update this policy from time to time. We will notify you via email or in-app notification for material changes. Continued use of our services after the changes means you accept the updated policy.' },
  { title: '10. Contact', body: 'For privacy-related queries, write to: privacy@farmersfactory.in or Farmers Factory Technologies Pvt. Ltd., 12th Floor, Prestige Tech Park, Marathahalli, Bangalore – 560037.' },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Privacy Policy</h1>
        <p className="text-neutral-400">Effective date: 1 January 2025. Last updated: May 2026.</p>
      </div>
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6 space-y-7">
        <p className="text-sm text-neutral-600 leading-relaxed">
          Farmers Factory Technologies Pvt. Ltd. ("Farmers Factory", "we", "us", or "our") is committed to protecting your privacy. This policy explains what data we collect, why, and how we use it when you use our website or app.
        </p>
        {SECTIONS.map(({ title, body }) => (
          <section key={title}>
            <h2 className="mb-2 font-black text-neutral-900">{title}</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
