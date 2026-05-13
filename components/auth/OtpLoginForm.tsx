'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, ArrowRight, Shield, ChevronLeft, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';

type Step = 'email' | 'signup' | 'otp' | 'success';

interface OtpLoginFormProps {
  onSuccess?: () => void;
}

export function OtpLoginForm({ onSuccess }: OtpLoginFormProps = {}) {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const addToast        = useUIStore((s) => s.addToast);
  const authCallbackUrl = useUIStore((s) => s.authModalCallbackUrl);
  const syncCart        = useCartStore((s) => s.syncWithServer);
  const setUser         = useUserStore((s) => s.setUser);

  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [isExisting, setIsExisting]   = useState(false);

  const [isLoading, setIsLoading]     = useState(false);
  const [emailError, setEmailError]   = useState('');
  const [signupError, setSignupError] = useState('');
  const [otpError, setOtpError]       = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp]               = useState('');

  const otpInputRef = useRef<HTMLInputElement>(null);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const startCooldown = useCallback(() => {
    setResendCooldown(30);
    const id = setInterval(() => {
      setResendCooldown((p) => {
        if (p <= 1) { clearInterval(id); return 0; }
        return p - 1;
      });
    }, 1000);
  }, []);

  const doRedirect = useCallback(() => {
    const callbackUrl = searchParams?.get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/')) { router.push(callbackUrl); return; }
    if (authCallbackUrl) { router.push(authCallbackUrl); return; }
    router.push('/account');
  }, [searchParams, authCallbackUrl, router]);

  // ── send OTP helper ────────────────────────────────────────────────────────
  const sendOtp = useCallback(async (
    emailAddr: string,
    nameVal?: string,
    phoneVal?: string,
  ) => {
    const res = await fetch('/api/auth/otp/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailAddr,
        ...(nameVal  && { name: nameVal }),
        ...(phoneVal && { phone: `+91${phoneVal}` }),
      }),
    });

    // Safely parse response — guard against HTML error pages
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      throw new Error(`Server error (${res.status}). Please try again.`);
    }
    const data = await res.json() as { error?: string; message?: string; emailSent?: boolean; devOtp?: string };
    if (!res.ok) throw new Error(data.error ?? 'Failed to send OTP');

    // Dev mode: server returns OTP directly so testers don't need email
    if (data.devOtp) {
      setDevOtp(data.devOtp);
      setOtp(data.devOtp);
    }

    setStep('otp');
    startCooldown();
    setTimeout(() => otpInputRef.current?.focus(), 80);

    addToast?.({ variant: 'success', title: 'Code Sent ✓', description: `OTP sent to ${emailAddr}` });
    return data;
  }, [startCooldown, addToast]);

  // ── Step 1: email submit → check existence ─────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setEmailError('Enter a valid email address'); return;
    }
    setIsLoading(true);
    try {
      const res  = await fetch(`/api/auth/check-user?email=${encodeURIComponent(trimmed)}`);
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        throw new Error('Server error. Please refresh and try again.');
      }
      const data = await res.json() as { exists: boolean; name: string | null };
      if (data.exists) {
        setIsExisting(true);
        if (data.name) setName(data.name);
        await sendOtp(trimmed);
      } else {
        setIsExisting(false);
        setStep('signup');
      }
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not reach server. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: signup form submit ─────────────────────────────────────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    const trimName  = name.trim();
    const trimPhone = phone.trim().replace(/\D/g, '');
    if (trimName.length < 2) { setSignupError('Name must be at least 2 characters'); return; }
    if (!/^[6-9]\d{9}$/.test(trimPhone)) { setSignupError('Enter a valid 10-digit mobile number'); return; }
    setIsLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase(), trimName, trimPhone);
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Failed to send OTP');
      addToast?.({ variant: 'error', title: 'Error', description: err instanceof Error ? err.message : 'Failed to send verification code.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!/^\d{6}$/.test(otp)) { setOtpError('Enter the 6-digit OTP'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name:  name || undefined,
          phone: phone ? `+91${phone.replace(/\D/g, '')}` : '',
          otp,
        }),
      });
      const data = await res.json() as { user?: any; error?: string };
      if (!res.ok) { setOtpError(data.error ?? 'Invalid OTP. Try again.'); return; }
      if (data.user) {
        setUser(data.user);
        document.cookie = 'ff_auth=1; path=/; max-age=2592000; SameSite=Lax';
        await syncCart?.();
        addToast?.({ 
          variant: 'success', 
          title: `Welcome back${data.user.name ? `, ${data.user.name.split(' ')[0]}` : ''}! 🎉`,
          description: 'You have successfully signed in.'
        });
        onSuccess?.();
        doRedirect();
      }
    } catch {
      setOtpError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtp(''); setOtpError('');
    try {
      await sendOtp(
        email.trim().toLowerCase(),
        name  || undefined,
        phone || undefined,
      );
    } catch { /* ignore */ }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="relative min-h-[350px]">
      <AnimatePresence mode="wait">
        {/* Step 1 — Email */}
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <form onSubmit={(e) => void handleEmailSubmit(e)} noValidate className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-primary-600 transition-all duration-300" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="you@example.com"
                    className={cn(
                      'flex h-14 w-full items-center rounded-2xl border bg-white pl-12 pr-4 text-base transition-all duration-300',
                      'placeholder:text-neutral-400 focus:outline-none',
                      'focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600',
                      'shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]',
                      emailError ? 'border-red-400 ring-4 ring-red-400/10' : 'border-neutral-200 hover:border-neutral-300',
                    )}
                  />
                </div>
                {emailError && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 px-1"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px]">!</span>
                    {emailError}
                  </motion.p>
                )}
              </div>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || email.length < 5}
                className={cn(
                  'group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl',
                  'bg-neutral-900 text-base font-bold text-white transition-all duration-300',
                  'hover:bg-neutral-800 active:scale-[0.98] shadow-xl shadow-neutral-900/10',
                  'disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 disabled:shadow-none',
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>

              <div className="flex items-center justify-center gap-2 px-1">
                <div className="h-px flex-1 bg-neutral-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">Fast & Secure</span>
                <div className="h-px flex-1 bg-neutral-100" />
              </div>

              <div className="rounded-2xl bg-neutral-50/50 p-4 border border-neutral-100/50 backdrop-blur-sm">
                <p className="text-[11px] leading-relaxed text-neutral-400 text-center">
                  By continuing, you agree to our <span className="text-neutral-900 font-bold hover:underline cursor-pointer">Terms</span> and <span className="text-neutral-900 font-bold hover:underline cursor-pointer">Privacy Policy</span>.
                </p>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 2 — Signup */}
        {step === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <form onSubmit={(e) => void handleSignupSubmit(e)} noValidate className="space-y-6">
              {/* Email chip (read-only) */}
              <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-2 pr-4 border border-neutral-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-neutral-200">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-neutral-900">{email}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setStep('email'); setName(''); setPhone(''); }}
                  className="text-[11px] font-black uppercase tracking-wider text-primary-600 hover:text-primary-700 underline underline-offset-4"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-neutral-900">Create Profile</h3>
                  <p className="text-sm text-neutral-500 font-medium">Just a few more details to get started.</p>
                </div>
                
                {/* Name */}
                <div className="space-y-2">
                  <label htmlFor="signup-name" className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-primary-600 transition-all duration-300" />
                    <input
                      id="signup-name" type="text" autoComplete="name" autoFocus
                      value={name}
                      onChange={(e) => { setName(e.target.value); setSignupError(''); }}
                      placeholder="e.g. John Doe"
                      className="flex h-14 w-full items-center rounded-2xl border border-neutral-200 bg-white pl-12 pr-4 text-base focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-600/10 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="signup-phone" className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500 ml-1">
                    Mobile Number
                  </label>
                  <div className="flex gap-3">
                    <div className="flex h-14 min-w-[70px] items-center justify-center rounded-2xl bg-neutral-50 text-sm font-black text-neutral-600 border border-neutral-200">
                      +91
                    </div>
                    <div className="relative flex-1 group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-primary-600 transition-all duration-300" />
                      <input
                        id="signup-phone" type="tel" inputMode="numeric" maxLength={10}
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setSignupError(''); }}
                        placeholder="98765 43210"
                        className="flex h-14 w-full items-center rounded-2xl border border-neutral-200 bg-white pl-12 pr-4 text-base focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-600/10 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {signupError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100 shadow-sm shadow-red-600/5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px]">!</span>
                  {signupError}
                </motion.p>
              )}

              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isLoading || name.length < 2 || phone.length < 10}
                className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-neutral-900 text-base font-bold text-white transition-all duration-300 hover:bg-neutral-800 active:scale-[0.98] shadow-xl shadow-neutral-900/10 disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>

              <button 
                type="button" 
                onClick={() => setStep('email')}
                className="flex w-full items-center justify-center gap-2 text-[13px] font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Email
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 3 — OTP */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <form onSubmit={(e) => void handleVerifyOtp(e)} noValidate className="space-y-6">
              {/* Info chip */}
              <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-2 pr-4 border border-neutral-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-neutral-200">
                  <Mail className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[10px] font-black uppercase tracking-widest text-neutral-400">Verifying Email</p>
                  <p className="truncate text-sm font-bold text-neutral-900">{email}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => { setStep(isExisting ? 'email' : 'signup'); setOtp(''); setOtpError(''); }}
                  className="text-[11px] font-black uppercase tracking-wider text-primary-600 hover:text-primary-700 underline underline-offset-4"
                >
                  Change
                </button>
              </div>

              {/* OTP field */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label htmlFor="otp-input" className="block text-[13px] font-bold uppercase tracking-wider text-neutral-500">
                    Enter Code
                  </label>
                  {resendCooldown > 0 && (
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Resend in {resendCooldown}s
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    ref={otpInputRef}
                    id="otp-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                    className={cn(
                      'h-20 w-full rounded-2xl border bg-white px-4 text-center text-4xl font-black tracking-[0.4em] transition-all duration-300',
                      'placeholder:tracking-[0.2em] placeholder:text-neutral-200 placeholder:font-black',
                      'focus:outline-none focus:ring-4 focus:ring-primary-600/10 focus:border-primary-600',
                      'shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]',
                      otpError ? 'border-red-400 bg-red-50/10 ring-4 ring-red-400/10' : 'border-neutral-200 hover:border-neutral-300',
                    )}
                  />
                  {otp.length === 6 && !isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600"
                    >
                      <Shield className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
                {otpError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-[11px] font-bold uppercase tracking-wider text-red-600"
                  >
                    {otpError}
                  </motion.p>
                )}
                {devOtp && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-center"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Dev Mode — Your OTP</p>
                    <p className="text-2xl font-black tracking-[0.3em] text-amber-800">{devOtp}</p>
                  </motion.div>
                )}
              </div>

              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={isLoading || otp.length !== 6}
                className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-neutral-900 text-base font-bold text-white transition-all duration-300 hover:bg-neutral-800 active:scale-[0.98] shadow-xl shadow-neutral-900/10 disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span>Verify Identity</span>
                    <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>

              {/* Resend */}
              <div className="pt-2 text-center">
                <button 
                  type="button" 
                  disabled={resendCooldown > 0}
                  onClick={() => void handleResend()}
                  className={cn(
                    'text-[13px] font-black uppercase tracking-wider transition-all duration-300',
                    resendCooldown > 0
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-900 hover:text-primary-600 hover:underline underline-offset-8 decoration-2'
                  )}
                >
                  Resend Verification Code
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 4 — Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center justify-center gap-6 py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border-2 border-green-200"
            >
              <span className="text-4xl">✓</span>
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight text-neutral-900">You&apos;re in!</h3>
              <p className="text-sm font-medium text-neutral-500">
                Welcome{name ? `, ${name.split(' ')[0]}` : ''}! Redirecting you now…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
