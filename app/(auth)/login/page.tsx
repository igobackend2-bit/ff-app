import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { OtpLoginForm } from '@/components/auth/OtpLoginForm';
import { BackButton } from '@/components/common/BackButton';

export const metadata: Metadata = {
  title: 'Sign In — Farmers Factory',
  description: 'Sign in to Farmers Factory to order fresh groceries.',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Already signed in? Don't show the form again — go where they were headed.
  const session = await auth();
  if (session?.user) {
    const { callbackUrl } = await searchParams;
    redirect(callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/account');
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
        <BackButton className="mb-6" />
        <h1 className="mb-1 text-2xl font-black tracking-tight text-neutral-900">
          Sign in to Farmers Factory
        </h1>
        <p className="mb-8 text-sm font-medium text-neutral-500">
          Enter your mobile number — we&apos;ll send you a one-time password
        </p>
        <Suspense>
          <OtpLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
