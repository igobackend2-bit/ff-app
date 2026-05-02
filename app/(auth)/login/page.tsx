// Skill #13 — OTP phone login
// Skill #30 — All inputs have <label>
// Skill #31 — type="tel" inputmode="numeric" maxLength={10}
// Skill #28 — Focus trap handled by Radix Dialog when used as modal
// Skill #17 — Zod validation client + server

import type { Metadata } from 'next';
import { OtpLoginForm } from '@/components/auth/OtpLoginForm';

export const metadata: Metadata = {
  title: 'Sign In — Farmers Factory',
  description: 'Sign in to Farmers Factory to order groceries and track your deliveries.',
  robots: { index: false, follow: false }, // Login page not indexed
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
        {/* Skill #26 — ONE h1 */}
        <h1 className="mb-1 text-2xl font-bold text-neutral-900">
          Welcome back 👋
        </h1>
        <p className="mb-6 text-sm text-neutral-600">
          Sign in with your phone number
        </p>

        <OtpLoginForm />
      </div>
    </div>
  );
}
