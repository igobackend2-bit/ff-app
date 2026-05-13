
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Clock, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers | Farmers Factory',
  description: 'Join the Farmers Factory team. We are hiring across tech, operations, logistics, and sales.',
};

const JOBS = [
  { title: 'Senior Full-Stack Engineer', dept: 'Engineering', location: 'Bangalore (Hybrid)', type: 'Full-time' },
  { title: 'Android Developer', dept: 'Engineering', location: 'Chennai / Remote', type: 'Full-time' },
  { title: 'City Head – Logistics', dept: 'Operations', location: 'Mumbai', type: 'Full-time' },
  { title: 'Category Manager – Vegetables', dept: 'Merchandising', location: 'Bangalore', type: 'Full-time' },
  { title: 'Field Sales Executive', dept: 'Sales', location: 'Multiple Cities', type: 'Full-time' },
  { title: 'Customer Experience Associate', dept: 'Support', location: 'Remote', type: 'Full-time' },
  { title: 'Data Analyst', dept: 'Analytics', location: 'Bangalore (Hybrid)', type: 'Full-time' },
  { title: 'Digital Marketing Executive', dept: 'Marketing', location: 'Bangalore / Remote', type: 'Full-time' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-4 py-16 text-center text-white">
        <h1 className="mb-3 text-3xl font-black md:text-5xl">Grow With Us</h1>
        <p className="mx-auto max-w-xl text-lg text-emerald-100">
          We are building the future of fresh food delivery in India. Join a team that cares about farmers, food quality, and great technology.
        </p>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">

        {/* Why FF */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-black text-neutral-900">Why Farmers Factory?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Meaningful Work', 'Every order you process helps a farmer earn a fair wage.'],
              ['Fast Growth', 'We are doubling every 6 months — your career grows with us.'],
              ['Great Benefits', 'Competitive salary, ESOPs, health insurance, and free groceries!'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                <p className="mb-1 font-bold text-neutral-900">{t}</p>
                <p className="text-sm text-neutral-600">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open roles */}
        <section>
          <h2 className="mb-4 text-xl font-black text-neutral-900">Open Roles</h2>
          <div className="space-y-3">
            {JOBS.map((job) => (
              <div key={job.title} className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm hover:border-emerald-200 transition-colors">
                <div>
                  <p className="font-bold text-neutral-900">{job.title}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.dept}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.type}</span>
                  </div>
                </div>
                <a href={`mailto:careers@farmersfactory.in?subject=Application: ${job.title}`}
                  className="ml-4 shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors">
                  Apply
                </a>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 p-6 text-center">
            <p className="font-bold text-neutral-700">Don't see a match?</p>
            <p className="mt-1 text-sm text-neutral-500">Send us your CV and we will reach out when the right role opens up.</p>
            <a href="mailto:careers@farmersfactory.in" className="mt-3 inline-block text-sm font-bold text-emerald-600 hover:underline">
              careers@farmersfactory.in
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
