'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export function SetupCategoriesButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function run() {
    setStatus('loading');
    try {
      const res  = await fetch('/api/admin/setup-categories');
      const data = (await res.json()) as { success: boolean; message?: string; error?: string };
      if (data.success) {
        setStatus('done');
        setMsg(data.message ?? 'Done');
        // Auto-reset after 4 s
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        setStatus('error');
        setMsg(data.error ?? 'Failed');
      }
    } catch (e) {
      setStatus('error');
      setMsg(String(e));
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => void run()}
        disabled={status === 'loading'}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors
          ${status === 'done'  ? 'bg-green-500 text-white' :
            status === 'error' ? 'bg-red-500 text-white' :
            'bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-60'}`}
      >
        {status === 'loading' ? <RefreshCw className="h-4 w-4 animate-spin" /> :
         status === 'done'    ? <CheckCircle2 className="h-4 w-4" /> :
         <RefreshCw className="h-4 w-4" />}
        {status === 'idle'    ? '📂 Setup Categories & Images' :
         status === 'loading' ? 'Setting up…' :
         status === 'done'    ? 'Done!' : 'Error'}
      </button>
      {msg && <p className="text-xs text-neutral-500 pl-1">{msg}</p>}
    </div>
  );
}
