'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);

  // If session cookie is still valid, skip straight to admin dashboard
  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => {
        if (r.ok) { void router.replace('/admin'); }
        setChecking(false); // always stop spinner regardless of outcome
      })
      .catch(() => setChecking(false));
  }, [router]);

  // Show a brief spinner while we verify the existing session
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-neutral-400">Checking session...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Login failed.');
        return;
      }
      router.replace('/admin');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-lg">
            <img src="/logo.jpg" alt="Farmers Factory" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-neutral-500">Farmers Factory — Staff Access Only</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary-600" />
            <p className="text-xs font-semibold text-primary-700">
              Restricted area. Authorised personnel only.
            </p>
          </div>

          <form onSubmit={(e) => void handleLogin(e)} noValidate className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="admin-user" className="mb-1.5 block text-sm font-semibold text-neutral-700">
                Username
              </label>
              <input
                id="admin-user"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="ffadmin"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-pass" className="mb-1.5 block text-sm font-semibold text-neutral-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-pass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••••"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 pr-11 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Farmers Factory Admin v1.0
        </p>
      </div>
    </div>
  );
}
