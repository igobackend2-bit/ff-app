
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Farmers Factory',
  description: 'Terms and conditions for using Farmers Factory grocery delivery services.',
};

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By accessing or using the Farmers Factory website or mobile application, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.' },
  { title: '2. Eligibility', body: 'You must be at least 18 years of age to create an account and place orders. By using our services, you represent that you meet this requirement.' },
  { title: '3. Account Registration', body: 'You are responsible for maintaining the confidentiality of your account credentials. You are liable for all activities that occur under your account. Notify us immediately at info.thefarmersfactory@gmail.com if you suspect unauthorised access.' },
  { title: '4. Product Availability & Pricing', body: 'All prices are in Indian Rupees and inclusive of applicable taxes. We reserve the right to modify prices without prior notice. Product availability is subject to stock and delivery area. We reserve the right to cancel orders if a product is unavailable or listed at an incorrect price due to a technical error.' },
  { title: '5. Orders & Delivery', body: 'Placing an order is an offer to purchase. We confirm acceptance via email/SMS. Delivery timelines are estimates and may vary due to weather, traffic, or force majeure. We are not liable for delays caused by factors outside our control.' },
  { title: '6. Payments', body: 'Payments must be made through our approved payment methods. By providing payment details, you authorise us to charge the applicable amount. All transactions are subject to the terms of the relevant payment gateway.' },
  { title: '7. Cancellations', body: 'Orders can be cancelled within 30 minutes of placement. After 30 minutes, cancellations may not be possible as the order will be in packing. Refunds for cancelled orders follow our Refund Policy.' },
  { title: '8. Intellectual Property', body: 'All content on this platform — including logos, images, text, and code — is the property of Farmers Factory Technologies Pvt. Ltd. and is protected under applicable intellectual property laws. Unauthorised reproduction is prohibited.' },
  { title: '9. Limitation of Liability', body: 'To the maximum extent permitted by law, Farmers Factory shall not be liable for indirect, incidental, or consequential damages arising from your use of our services. Our total liability shall not exceed the value of the order in dispute.' },
  { title: '10. Governing Law', body: 'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.' },
  { title: '11. Changes to Terms', body: 'We reserve the right to update these terms at any time. Continued use of the services after changes constitutes acceptance. We will notify you via email for material changes.' },
  { title: '12. Contact', body: 'For queries about these terms, contact info.thefarmersfactory@gmail.com or write to Farmers Factory, No 17, Kovalan Street, 2nd Main Road, Uthandi Kanathur, Chennai – 600119.' },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-900 px-4 py-14 text-center text-white">
        <h1 className="mb-2 text-3xl font-black">Terms of Service</h1>
        <p className="text-neutral-400">Effective date: 1 January 2025. Last updated: May 2026.</p>
      </div>
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6 space-y-7">
        <p className="text-sm text-neutral-600 leading-relaxed">
          Please read these Terms of Service carefully before using the Farmers Factory platform. These terms constitute a legally binding agreement between you and Farmers Factory Technologies Pvt. Ltd.
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
