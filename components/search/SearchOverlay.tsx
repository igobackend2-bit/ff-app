'use client';
// v7 — voice search: getUserMedia inside click for correct permission prompt
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Plus, ArrowLeft, Mic, MicOff, Camera, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useUIStore } from '@/store/uiStore';
import { useCartStore } from '@/store/cartStore';
import { useProductDetailStore } from '@/store/productDetailStore';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

const RECENT_KEY = 'qc-recent-searches';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]; }
  catch { return []; }
}
function saveRecent(q: string) {
  try {
    const prev = getRecent().filter((s) => s !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 8)));
  } catch { /**/ }
}

const POPULAR = ['Tomato', 'Mango', 'Rice', 'Jaggery', 'Groundnut Oil', 'Organic Milk', 'Banana', 'Turmeric', 'Spinach', 'Coconut Oil'];

/* ── Web Speech API types (not in all TS libs) ─────────────────────── */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult:  ((e: SpeechRecognitionEvent) => void) | null;
  onerror:   ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend:     (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

/* ── Voice search hook ─────────────────────────────────────────────── */
function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening]   = useState(false);
  const [supported, setSupported]   = useState(false);
  const [error, setError]           = useState('');
  const [permDenied, setPermDenied] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const warmStreamRef  = useRef<MediaStream | null>(null);
  const onResultRef    = useRef(onResult);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => {
    setSupported(!!(window.SpeechRecognition ?? window.webkitSpeechRecognition));
  }, []);

  const releaseWarm = useCallback(() => {
    warmStreamRef.current?.getTracks().forEach((t) => t.stop());
    warmStreamRef.current = null;
  }, []);

  /**
   * start() — called from mic button click (user gesture).
   *
   * Flow:
   *  1. getUserMedia() — WITHIN the user gesture, so Edge/Chrome shows the
   *     mic permission prompt if not yet granted. User clicks Allow.
   *  2. Once stream is acquired (permission is now 'granted'), SR can start
   *     without needing its own separate permission prompt.
   *  3. Keep the warm stream alive while SR starts, release it afterwards.
   *
   * Why getUserMedia first:
   *  SpeechRecognition.start() on a site with mic in 'prompt' state (never
   *  asked before) silently returns 'not-allowed' in Edge/Chrome without
   *  showing a prompt. getUserMedia IS shown a prompt. After the user allows
   *  it, permission becomes 'granted' and SR starts cleanly.
   */
  const start = useCallback(async () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setError('not-supported'); return; }

    setPermDenied(false);
    setError('');
    recognitionRef.current?.stop();
    releaseWarm();

    /* ── Step 1: Request mic via getUserMedia (shows browser prompt) ── */
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      warmStreamRef.current = stream; // keep alive during SR start
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('no-device');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('busy');
      } else {
        /* User clicked Block on the prompt, or mic is denied in settings */
        setPermDenied(true);
        setError('blocked');
      }
      return;
    }

    /* ── Step 2: Mic is now 'granted' — start SR (no user gesture needed) ── */
    const launchRec = (lang: 'en-IN' | 'en-US') => {
      const rec = new SR!();
      rec.lang           = lang;
      rec.continuous     = false;
      rec.interimResults = false;

      rec.onresult = (e: SpeechRecognitionEvent) => {
        releaseWarm();
        const transcript = (e.results[0]?.[0]?.transcript ?? '')
          .replace(/[.,!?;:]+$/, '') // strip trailing punctuation added by SR
          .trim();
        if (transcript) {
          onResultRef.current(transcript);
          setError('');
        }
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        releaseWarm();
        setListening(false);
        console.warn('[VoiceSearch] SR error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setPermDenied(true);
          setError('blocked');
        } else if (e.error === 'no-speech') {
          setError('no-speech');
        } else if (e.error === 'language-not-supported' && lang === 'en-IN') {
          setTimeout(() => launchRec('en-US'), 80);
          return;
        } else if (e.error === 'network') {
          setError('network');
        } else if (e.error === 'audio-capture') {
          /* SR couldn't claim the mic — treat same as "mic busy" */
          setError('busy');
        } else {
          setError('sr-error:' + (e.error || 'unknown'));
        }
      };

      rec.onend = () => { releaseWarm(); setListening(false); };
      recognitionRef.current = rec;

      /* Release getUserMedia stream BEFORE SR.start() so SR can claim the mic.
         Permission stays 'granted' after the stream is released. */
      releaseWarm();

      try {
        rec.start();
        setListening(true);
      } catch {
        setError('start-failed');
      }
    };

    launchRec('en-IN');
  }, [releaseWarm]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    releaseWarm();
    setListening(false);
  }, [releaseWarm]);

  const reset = useCallback(() => {
    recognitionRef.current?.stop();
    releaseWarm();
    setListening(false);
    setError('');
    setPermDenied(false);
  }, [releaseWarm]);

  const clearError = useCallback(() => { setError(''); setPermDenied(false); }, []);

  return { listening, supported, error, permDenied, start, stop, reset, clearError };
}

export function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useUIStore();
  const inputRef    = useRef<HTMLInputElement>(null);
  const cameraRef   = useRef<HTMLInputElement>(null);

  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState<Product[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [recent, setRecent]         = useState<string[]>([]);

  /* Camera state */
  const [cameraPreview, setCameraPreview]   = useState<string | null>(null);
  const [cameraLabel, setCameraLabel]       = useState('');

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isSearchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSearchOpen]);

  /* escape key */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSearch]);

  /* load recent + autofocus when opening */
  useEffect(() => {
    if (isSearchOpen) {
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults([]);
      setCameraPreview(null);
      setCameraLabel('');
    }
  }, [isSearchOpen]);

  /* debounced search */
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q.trim())}&limit=30`);
      if (!res.ok) { setResults([]); return; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = await res.json() as any;
      const items: Product[] =
        Array.isArray(json?.data?.data) ? (json.data.data as Product[]) :
        Array.isArray(json?.data)       ? (json.data as Product[])       : [];
      setResults(items);
      if (items.length > 0) { saveRecent(q.trim()); setRecent(getRecent()); }
    } catch { setResults([]); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void doSearch(query); }, 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  /* ── Voice search ── */
  const handleVoiceResult = useCallback((text: string) => {
    setQuery(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);
  const voice = useVoiceSearch(handleVoiceResult);

  /* ── Clear/reset mic state on overlay open/close ── */
  useEffect(() => {
    if (isSearchOpen) {
      voice.clearError();   // wipe any stale error from previous session
    } else {
      voice.reset();        // stop SR, release warm stream, wipe errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchOpen]);

  /* ── Camera / image search ── */
  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    /* Show image preview */
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCameraPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    /* Extract a clean search term from the filename */
    const rawName = file.name.replace(/\.[^.]+$/, '');           // strip extension
    const cleaned = rawName
      .replace(/[-_]+/g, ' ')                                    // dashes/underscores → spaces
      .replace(/\d{4,}/g, '')                                    // strip long numbers (timestamps)
      .replace(/\s+/g, ' ')
      .trim();
    const label = cleaned.length > 2 ? cleaned : '';
    setCameraLabel(label);
    if (label) setQuery(label);

    /* Reset input so the same file can be re-selected */
    e.target.value = '';
  };

  const clearCamera = () => {
    setCameraPreview(null);
    setCameraLabel('');
  };

  const showIdle    = !isLoading && !query.trim() && !cameraPreview;
  const showEmpty   = !isLoading && (query.trim().length > 0 || cameraPreview) && results.length === 0;
  const showResults = !isLoading && results.length > 0;

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSearch}
            className="fixed inset-0 z-[6500] bg-black/40"
          />

          {/* ── Search panel ── */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'fixed left-0 right-0 top-16 z-[7000]',
              'mx-auto max-w-screen-xl',
              'flex flex-col bg-white shadow-2xl',
              'rounded-b-3xl overflow-hidden',
              'max-h-[calc(100vh-4rem)]',
            )}
            role="search"
            aria-label="Search products"
          >
            {/* ── Search input bar ── */}
            <div className="flex shrink-0 items-center gap-2 border-b border-neutral-100 bg-white px-3 py-3">
              <button
                onClick={closeSearch}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (!e.target.value) clearCamera(); }}
                  placeholder={voice.listening ? 'Listening…' : 'Search groceries, brands, categories…'}
                  className={cn(
                    'h-11 w-full rounded-2xl border bg-neutral-50 pl-10 pr-10 text-sm font-medium',
                    'placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2',
                    voice.listening
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100 placeholder:text-red-400'
                      : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100',
                  )}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); clearCamera(); }}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* ── Voice search button ── always visible */}
              <button
                onClick={voice.listening ? voice.stop : () => { void voice.start(); }}
                aria-label={voice.listening ? 'Stop listening' : 'Search by voice'}
                title={voice.listening ? 'Tap to stop' : 'Voice search'}
                className={cn(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all',
                  voice.listening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                    : voice.permDenied
                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-primary-50 hover:text-primary-600',
                )}
              >
                {voice.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                {/* Ripple ring when listening */}
                {voice.listening && (
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60" />
                )}
              </button>

              {/* ── Camera / image search button ── */}
              <button
                onClick={() => cameraRef.current?.click()}
                aria-label="Search by image"
                title="Search by image"
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all',
                  cameraPreview
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-primary-50 hover:text-primary-600',
                )}
              >
                <Camera className="h-5 w-5" />
              </button>

              {/* Hidden file input — accepts camera & gallery on mobile */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraChange}
              />
            </div>

            {/* ── Voice error banner ── */}
            {voice.error && (
              voice.error === 'no-device' ? (
                /* No microphone hardware found */
                <div className="shrink-0 flex items-center gap-3 border-b border-red-100 bg-red-50 px-4 py-3">
                  <MicOff className="h-4 w-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-red-700">No microphone found</p>
                    <p className="text-[11px] text-red-600">Connect a microphone or headset, then tap the mic again.</p>
                  </div>
                  <button onClick={voice.clearError} className="shrink-0 text-red-300 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : voice.error === 'busy' ? (
                /* Mic in use by another app */
                <div className="shrink-0 flex items-center gap-3 border-b border-orange-100 bg-orange-50 px-4 py-3">
                  <MicOff className="h-4 w-4 text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-orange-700">Microphone is busy</p>
                    <p className="text-[11px] text-orange-600">Close other apps using the mic (Teams, Zoom, etc.), then try again.</p>
                    <button
                      onClick={() => { voice.clearError(); void voice.start(); }}
                      className="mt-1.5 rounded-xl bg-orange-500 px-3 py-1 text-[11px] font-bold text-white hover:bg-orange-600 active:scale-95 transition-all"
                    >Try Again</button>
                  </div>
                  <button onClick={voice.clearError} className="shrink-0 text-orange-300 hover:text-orange-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : voice.permDenied ? (
                /* Permission blocked — step-by-step instructions */
                <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <MicOff className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-800 mb-1">Microphone access blocked</p>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        <strong>Step 1:</strong> Click the <strong>🔒 lock</strong> in the address bar<br/>
                        <strong>Step 2:</strong> Find <strong>Microphone</strong> → if it shows <em>Allow</em>, click the <strong>×</strong> to reset it, then set to <strong>Allow</strong> again<br/>
                        <strong>Step 3:</strong> Click <strong>Reload Page</strong> below, then try the mic again
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => { voice.clearError(); void voice.start(); }}
                          className="rounded-xl bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700 active:scale-95 transition-all"
                        >Try Again</button>
                        <button
                          onClick={() => window.location.reload()}
                          className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-50 active:scale-95 transition-all"
                        >Reload Page</button>
                      </div>
                    </div>
                    <button onClick={voice.clearError} className="shrink-0 text-amber-400 hover:text-amber-600 mt-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : voice.error === 'sr-retry' ? (
                /* gUM ok but SR denied — transient browser issue, just retry */
                <div className="shrink-0 flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-4 py-2">
                  <MicOff className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-700">Voice recognition failed</p>
                    <p className="text-[11px] text-amber-600">Tap the mic again to retry, or reload the page once.</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { voice.clearError(); void voice.start(); }}
                      className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 transition-all">
                      Retry
                    </button>
                    <button onClick={() => window.location.reload()}
                      className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 transition-all">
                      Reload
                    </button>
                  </div>
                  <button onClick={voice.clearError} className="shrink-0 text-amber-400 hover:text-amber-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : voice.error === 'no-speech' ? (
                /* No speech detected */
                <div className="shrink-0 flex items-center gap-2 bg-neutral-50 border-b border-neutral-100 px-4 py-2">
                  <Mic className="h-3.5 w-3.5 text-neutral-400" />
                  <p className="text-xs text-neutral-500">No speech detected — tap the mic and speak clearly</p>
                  <button onClick={voice.clearError} className="ml-auto text-neutral-300 hover:text-neutral-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* Generic / not-supported / start-failed */
                <div className="shrink-0 flex items-center gap-2 bg-red-50 border-b border-red-100 px-4 py-2">
                  <MicOff className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-xs font-semibold text-red-600">
                    {voice.error === 'not-supported'
                      ? 'Voice search not supported in this browser — try Chrome or Edge'
                      : 'Voice error — tap the mic to try again'}
                  </p>
                  <button onClick={voice.clearError} className="ml-auto text-red-300 hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            )}

            {/* ── Voice listening indicator ── */}
            {voice.listening && (
              <div className="shrink-0 flex items-center justify-center gap-2 bg-red-50 px-4 py-2.5">
                <div className="flex items-end gap-0.5 h-5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-red-500"
                      style={{
                        height: `${30 + Math.sin(i * 0.8) * 30}%`,
                        animation: `pulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-red-600">Listening… speak now</span>
                <button
                  onClick={voice.stop}
                  className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-200"
                >
                  Done
                </button>
              </div>
            )}

            {/* ── Camera image preview banner ── */}
            {cameraPreview && (
              <div className="shrink-0 flex items-center gap-3 border-b border-neutral-100 bg-primary-50 px-4 py-2">
                {/* Thumbnail */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-primary-200 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cameraPreview} alt="Uploaded" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ImageIcon className="h-3.5 w-3.5 text-primary-600" />
                    <p className="text-[11px] font-black uppercase tracking-wider text-primary-700">Image Search</p>
                  </div>
                  {cameraLabel ? (
                    <p className="text-xs text-neutral-600">
                      Searching for <span className="font-semibold text-neutral-900">&ldquo;{cameraLabel}&rdquo;</span>
                      <span className="text-neutral-400"> — edit the query above to refine</span>
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500">Type a product name above to search</p>
                  )}
                </div>
                <button
                  onClick={() => { clearCamera(); setQuery(''); }}
                  aria-label="Remove image"
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ── Scrollable results area ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain" aria-live="polite">

              {/* Loading skeletons */}
              {isLoading && (
                <div className="px-4 pt-4 pb-2">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                        <div className="aspect-square animate-pulse bg-neutral-100" />
                        <div className="space-y-1.5 p-2">
                          <div className="h-2.5 w-4/5 animate-pulse rounded bg-neutral-100" />
                          <div className="h-2 w-1/3 animate-pulse rounded bg-neutral-100" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {showEmpty && (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  {cameraPreview && (
                    <div className="mb-2 h-20 w-20 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cameraPreview} alt="Searched" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <Search className="h-10 w-10 text-neutral-200" />
                  <p className="text-sm font-bold text-neutral-700">
                    No results for &ldquo;{query || 'this image'}&rdquo;
                  </p>
                  <p className="text-xs text-neutral-400">Try a different word or browse categories below.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {POPULAR.slice(0, 5).map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results grid */}
              {showResults && (
                <div className="px-4 pt-3 pb-5">
                  {/* Show image preview above results when camera was used */}
                  {cameraPreview && (
                    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-primary-200 bg-white shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cameraPreview} alt="Search image" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-wider text-primary-700">
                          Image Search Results
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {results.length} product{results.length !== 1 ? 's' : ''} found for &ldquo;{query}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {!cameraPreview && (
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                      {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {results.map((product) => (
                      <SearchProductCard key={product.id} product={product} onClose={closeSearch} />
                    ))}
                  </div>
                </div>
              )}

              {/* Idle state — recent + popular */}
              {showIdle && (
                <div className="px-4 pt-4 pb-5 space-y-5">
                  {recent.length > 0 && (
                    <section>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-neutral-400">Recent</p>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((s) => (
                          <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                          >
                            <Clock className="h-3 w-3 text-neutral-400 shrink-0" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Voice & Camera hints when idle */}
                  <section>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-neutral-400">Search Options</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { void voice.start(); }}
                        className="flex flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                          <Mic className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">Voice Search</p>
                          <p className="text-[10px] text-neutral-400">Say a product name</p>
                        </div>
                      </button>
                      <button
                        onClick={() => cameraRef.current?.click()}
                        className="flex flex-1 items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                          <Camera className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800">Camera Search</p>
                          <p className="text-[10px] text-neutral-400">Upload a product photo</p>
                        </div>
                      </button>
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-neutral-400">Popular Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR.map((s) => (
                        <button
                          key={s}
                          onClick={() => setQuery(s)}
                          className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Compact product card for search results ── */
function SearchProductCard({ product, onClose }: { product: Product; onClose: () => void }) {
  const openSheet = useProductDetailStore((s) => s.openSheet);
  const addItem   = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const addToast  = useUIStore((s) => s.addToast);

  const cartQty  = cartItems.find((i) => i.productId === product.id)?.quantity ?? 0;
  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!product.inStock) return;
    addItem(product, 1);
    addToast({ title: `${product.name} added`, variant: 'success' });
  }

  function handleOpen() {
    openSheet(product);
    onClose();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        {!product.inStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[9px] font-bold text-neutral-600">Out of Stock</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-1 top-1 z-10 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            {discount}%
          </span>
        )}
        {product.imageUrls[0] ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 33vw, 20vw"
            className={cn('object-contain p-1.5 transition-transform group-hover:scale-105', !product.inStock && 'grayscale')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">🌿</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-neutral-800">{product.name}</p>
        <p className="text-[10px] text-neutral-400">{product.unit}</p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="text-xs font-black text-neutral-900">{formatPrice(product.price)}</span>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-xl transition-all',
              product.inStock
                ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-90'
                : 'bg-neutral-100 text-neutral-300 cursor-not-allowed',
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {cartQty > 0 && (
          <p className="mt-0.5 text-[9px] font-bold text-primary-600">{cartQty} in cart</p>
        )}
      </div>
    </div>
  );
}
