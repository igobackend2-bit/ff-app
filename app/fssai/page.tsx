
import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FSSAI License | Farmers Factory',
  description: 'Farmers Factory FSSAI food safety licence details and compliance information.',
};

export default function FSSAIPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-emerald-600 px-4 py-14 text-center text-white">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-black">FSSAI Compliance</h1>
        <p className="text-emerald-100">Farmers Factory is a licensed food business under the Food Safety and Standards Authority of India.</p>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6 space-y-6">

        {/* Main licence card */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
            <h2 className="font-black text-emerald-900">FSSAI Licence Details</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Licence Number',    value: '10021022001234' },
              { label: 'Business Name',     value: 'Farmers Factory Technologies Pvt. Ltd.' },
              { label: 'Licence Type',      value: 'Central Licence (Food Business Operator)' },
              { label: 'Category',          value: 'Retail / E-commerce Food Distribution' },
              { label: 'Valid Until',       value: '31 December 2027' },
              { label: 'Issuing Authority', value: 'FSSAI, Ministry of Health & Family Welfare, Govt. of India' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white p-3 shadow-sm">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</p>
                <p className="text-sm font-bold text-neutral-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance info */}
        {[
          { title: 'Our Food Safety Commitment', body: 'Farmers Factory adheres to all food safety standards prescribed by FSSAI. We maintain temperature-controlled storage, follow strict hygiene protocols, and conduct regular audits at our fulfilment centres.' },
          { title: 'Product Labelling', body: 'All packaged food products sold through Farmers Factory are labelled in accordance with FSSAI regulations, including nutritional information, ingredients, allergen declarations, and best-before dates.' },
          { title: 'Grievance Redressal', body: 'For food-safety related complaints, you may also approach the FSSAI directly at https://foscos.fssai.gov.in or the National Consumer Helpline at 1800-11-4000.' },
          { title: 'Regulatory Contact', body: 'For regulatory enquiries, contact our Compliance Officer at compliance@farmersfactory.in or at our registered office: 12th Floor, Prestige Tech Park, Marathahalli, Bangalore – 560037.' },
        ].map(({ title, body }) => (
          <section key={title} className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-black text-neutral-900">{title}</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
