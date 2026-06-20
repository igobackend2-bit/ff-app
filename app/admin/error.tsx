'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-neutral-900">Admin Panel Error</h1>
            <p className="text-xs text-neutral-400">Something went wrong loading this page</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">{error.message || 'Unknown error'}</p>
          {error.digest && (
            <p className="mt-1 text-xs text-red-400">Error ID: {error.digest}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
          >
            Try Again
          </button>
          <a
            href="/admin/login"
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
