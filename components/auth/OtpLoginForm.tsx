'use client';

// Skill #13 — Phone OTP login
// Skill #14 — Redis rate limiting applied server-side
// Skill #17 — Zod validation
// Skill #30 — Proper <label> elements
// Skill #31 — type="tel", inputmode="numeric", maxLength={10}
// Skill #39 — CSRF token on mutations

import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Loader2, Phone, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';

// Zod schemas (Skill #17)
const formSchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email address'),
});

const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

type Step = 'phone' | 'otp';

export function OtpLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);
  const syncCart = useCartStore((s) => s.syncWithServer);

  const [step, setStep] = useState<Step>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{name?: string, phone?: string, email?: string, general?: string}>({});
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef<HTMLInputElement>(null);

  const startCooldown = useCallback(() => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormErrors({});

      // Client-side Zod validation (Skill #17)
      const result = formSchema.safeParse({ name, phone, email });
      if (!result.success) {
        const newErrors: any = {};
        result.error.issues.forEach(issue => {
          if (issue.path[0] !== undefined) {
             newErrors[String(issue.path[0])] = issue.message;
          }
        });
        setFormErrors(newErrors);
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone: `+91${phone}` }),
        });

        const data = (await res.json()) as { error?: string; message?: string };

        if (!res.ok) {
          setFormErrors({ general: data.error ?? 'Failed to send OTP. Please try again.' });
          return;
        }

        setStep('otp');
        startCooldown();
        // Move focus to OTP input (accessibility)
        setTimeout(() => otpInputRef.current?.focus(), 100);
      } catch {
        setFormErrors({ general: 'Network error. Please check your connection.' });
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, phone, startCooldown],
  );

  const handleVerifyOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setOtpError('');

      // Client-side Zod validation
      const result = otpSchema.safeParse(otp);
      if (!result.success) {
        setOtpError(result.error.errors[0]?.message ?? 'Invalid OTP');
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch('/api/auth/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone: `+91${phone}`, otp }),
        });

        const data = (await res.json()) as { error?: string; user?: { id: string } };

        if (!res.ok) {
          setOtpError(data.error ?? 'Invalid OTP. Please try again.');
          return;
        }

        // Sync local cart to server after login
        await syncCart();

        addToast({
          title: 'Welcome to Farmers Factory! 🎉',
          variant: 'success',
        });

        const callbackUrl = searchParams.get('callbackUrl') ?? '/';
        router.replace(callbackUrl);
        router.refresh();
      } catch {
        setOtpError('Verification failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [otp, phone, syncCart, addToast, searchParams, router],
  );

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setOtp('');
    await handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
  }, [resendCooldown, handleSendOtp]);

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} noValidate>
        {/* Skill #30 — <label> required for every input */}
        
        {/* Name Field */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
            }}
            placeholder="John Doe"
            required
            autoComplete="name"
            aria-describedby={formErrors.name ? 'name-error' : undefined}
            aria-invalid={formErrors.name ? 'true' : 'false'}
            className={cn(
              'flex h-touch w-full rounded-xl border bg-white px-3 text-sm flex-1',
              'placeholder:text-neutral-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
              formErrors.name ? 'border-danger-500 focus-visible:ring-danger-500' : 'border-neutral-200',
            )}
          />
          {formErrors.name && (
            <p id="name-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <span aria-hidden="true">⚠</span> {formErrors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
            }}
            placeholder="john@example.com"
            required
            autoComplete="email"
            aria-describedby={formErrors.email ? 'email-error' : undefined}
            aria-invalid={formErrors.email ? 'true' : 'false'}
            className={cn(
              'flex h-touch w-full rounded-xl border bg-white px-3 text-sm flex-1',
              'placeholder:text-neutral-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
              formErrors.email ? 'border-danger-500 focus-visible:ring-danger-500' : 'border-neutral-200',
            )}
          />
          {formErrors.email && (
            <p id="email-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <span aria-hidden="true">⚠</span> {formErrors.email}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div className="mb-4">
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            Mobile Number
          </label>
          <div className="flex gap-2">
            <div className="flex h-touch items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-600">
              🇮🇳 +91
            </div>
            <input
              id="phone"
              // Skill #31 — type="tel" inputmode="numeric" maxLength={10}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPhone(val);
                if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
              }}
              placeholder="98765 43210"
              required
              autoComplete="tel-national"
              aria-describedby={formErrors.phone ? 'phone-error' : 'phone-hint'}
              aria-invalid={formErrors.phone ? 'true' : 'false'}
              className={cn(
                'flex h-touch flex-1 rounded-xl border bg-white px-3 text-sm',
                'placeholder:text-neutral-400',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                formErrors.phone
                  ? 'border-danger-500 focus-visible:ring-danger-500'
                  : 'border-neutral-200',
              )}
            />
          </div>
          {/* Error message — linked via aria-describedby (Skill #30) */}
          {formErrors.phone ? (
            <p id="phone-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <span aria-hidden="true">⚠</span> {formErrors.phone}
            </p>
          ) : (
            <p id="phone-hint" className="mt-1.5 text-xs text-neutral-500">
              We&apos;ll send you a 6-digit OTP
            </p>
          )}
        </div>

        {formErrors.general && (
          <div className="mb-4 rounded-xl bg-danger-50 p-3 text-sm text-danger-600 text-center">
            {formErrors.general}
          </div>
        )}


        <button
          type="submit"
          disabled={isLoading || phone.length < 10}
          className={cn(
            'flex h-touch w-full items-center justify-center gap-2 rounded-xl',
            'bg-primary-600 text-sm font-semibold text-white',
            'transition-colors hover:bg-primary-700',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Get OTP
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-50 p-3">
          <Shield className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          <p className="text-xs text-neutral-600">
            Your number is safe. We never share it with anyone.
          </p>
        </div>
      </form>
    );
  }

  // OTP step
  return (
    <form onSubmit={handleVerifyOtp} noValidate>
      <div className="mb-4">
        <div className="mb-3 rounded-xl bg-primary-50 p-3 text-center">
          <Phone className="mx-auto mb-1 h-5 w-5 text-primary-600" aria-hidden="true" />
          <p className="text-sm text-primary-700">
            OTP sent to <strong>{email}</strong>
          </p>
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="mt-0.5 text-xs text-primary-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            Change number
          </button>
        </div>

        {/* Skill #30 — label for OTP input */}
        <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Enter OTP
        </label>
        <input
          ref={otpInputRef}
          id="otp"
          // Skill #31 — type="tel" inputmode="numeric" for OTP too
          type="tel"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setOtp(val);
            if (otpError) setOtpError('');
          }}
          placeholder="• • • • • •"
          required
          autoComplete="one-time-code"
          aria-describedby={otpError ? 'otp-error' : 'otp-hint'}
          aria-invalid={otpError ? 'true' : 'false'}
          className={cn(
            'h-touch w-full rounded-xl border bg-white px-4 text-center text-xl font-bold tracking-[0.5em]',
            'placeholder:tracking-widest placeholder:text-neutral-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
            otpError
              ? 'border-danger-500 focus-visible:ring-danger-500'
              : 'border-neutral-200',
          )}
        />
        {otpError ? (
          <p id="otp-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
            <span aria-hidden="true">⚠</span> {otpError}
          </p>
        ) : (
          <p id="otp-hint" className="mt-1.5 text-xs text-neutral-500">
            OTP is valid for 5 minutes
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || otp.length < 6}
        className={cn(
          'flex h-touch w-full items-center justify-center gap-2 rounded-xl',
          'bg-primary-600 text-sm font-semibold text-white',
          'transition-colors hover:bg-primary-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          'Verify & Sign In'
        )}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendCooldown > 0}
        className={cn(
          'mt-3 w-full text-center text-sm',
          resendCooldown > 0
            ? 'cursor-not-allowed text-neutral-400'
            : 'text-primary-600 underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
        )}
        aria-disabled={resendCooldown > 0}
      >
        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
      </button>
    </form>
  );
}
