'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  ImagePlus, Trash2, ToggleLeft, ToggleRight,
  Plus, Loader2, Save, X, ArrowUp, ArrowDown, ExternalLink,
  Video, Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────── */
interface BannerRow {
  id: string;
  title: string;
  imageUrl: string;
  altText: string;   // JSON string with headline/subtitle/ctaText/bgGradient/videoUrl/screenshot1/screenshot2
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  position: string;
}

interface ParsedExtra {
  headline: string;
  subtitle: string;
  ctaText: string;
  bgGradient: string;
  videoUrl: string;
  screenshot1: string;
  screenshot2: string;
}

function parseExtra(altText: string): ParsedExtra {
  try { return { videoUrl: '', screenshot1: '', screenshot2: '', ...JSON.parse(altText) } as ParsedExtra; }
  catch { return { headline: '', subtitle: '', ctaText: 'Shop Now', bgGradient: 'from-emerald-700 via-green-600 to-teal-600', videoUrl: '', screenshot1: '', screenshot2: '' }; }
}

/* ─── Gradient options ───────────────────────────────────── */
const GRADIENTS = [
  { label: 'Green (Farmers)', value: 'from-emerald-700 via-green-600 to-teal-600' },
  { label: 'Amber (Valluvam)', value: 'from-orange-600 via-amber-600 to-yellow-600' },
  { label: 'Indigo', value: 'from-blue-700 via-indigo-600 to-violet-700' },
  { label: 'Lime', value: 'from-lime-700 via-green-700 to-emerald-800' },
  { label: 'Rose', value: 'from-rose-600 via-pink-600 to-fuchsia-700' },
  { label: 'Cyan', value: 'from-cyan-700 via-sky-600 to-blue-600' },
];

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';

/* ─── Empty form state ───────────────────────────────────── */
const emptyForm = () => ({
  title: '',
  headline: '',
  subtitle: '',
  ctaText: 'Shop Now',
  bgGradient: 'from-emerald-700 via-green-600 to-teal-600',
  imageUrl: '',
  videoUrl: '',
  screenshot1: '',
  screenshot2: '',
  linkUrl: '/',
  isActive: true,
  position: 'hero',
});

/* ─── Upload file to server, return URL ─────────────────── */
async function uploadToServer(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res  = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
  const data = await res.json() as { ok?: boolean; url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
  return data.url;
}

/* ═══════════════════════════════════════════════════════════ */
export default function AdminBannersPage() {
  const [banners, setBanners]       = useState<BannerRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [mediaTab, setMediaTab]     = useState<'image' | 'video'>('image');

  const [form, setForm] = useState(emptyForm());
  const imgRef   = useRef<HTMLInputElement>(null);
  const vidRef   = useRef<HTMLInputElement>(null);
  const ss1Ref   = useRef<HTMLInputElement>(null);
  const ss2Ref   = useRef<HTMLInputElement>(null);

  useEffect(() => { void fetchBanners(); }, []);

  async function fetchBanners() {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/banners');
      const data = (await res.json()) as { data: BannerRow[] };
      setBanners(data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyForm());
    setMediaTab('image');
    setError('');
    setShowForm(true);
  }

  function openEdit(b: BannerRow) {
    const ex = parseExtra(b.altText);
    setEditId(b.id);
    setForm({
      title:       b.title,
      headline:    ex.headline,
      subtitle:    ex.subtitle,
      ctaText:     ex.ctaText,
      bgGradient:  ex.bgGradient,
      imageUrl:    b.imageUrl,
      videoUrl:    ex.videoUrl,
      screenshot1: ex.screenshot1,
      screenshot2: ex.screenshot2,
      linkUrl:     b.linkUrl ?? '/',
      isActive:    b.isActive,
      position:    b.position ?? 'hero',
    });
    setMediaTab(ex.videoUrl ? 'video' : 'image');
    setError('');
    setShowForm(true);
  }

  /* ── image upload ── */
  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setUploading(true);
    try {
      const url = await uploadToServer(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (imgRef.current) imgRef.current.value = '';
    }
  }

  /* ── video upload ── */
  async function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setUploading(true);
    try {
      const url = await uploadToServer(file);
      setForm((f) => ({ ...f, videoUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setUploading(false);
      if (vidRef.current) vidRef.current.value = '';
    }
  }

  /* ── screenshot uploads ── */
  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setUploading(true);
    try {
      const url = await uploadToServer(file);
      if (slot === 1) setForm((f) => ({ ...f, screenshot1: url }));
      else            setForm((f) => ({ ...f, screenshot2: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Screenshot ${slot} upload failed`);
    } finally {
      setUploading(false);
      const ref = slot === 1 ? ss1Ref : ss2Ref;
      if (ref.current) ref.current.value = '';
    }
  }

  /* ── save ── */
  async function handleSave() {
    // Badge label is optional — no validation required
    setError('');
    setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        headline:    form.headline.trim(),
        subtitle:    form.subtitle.trim(),
        ctaText:     form.ctaText.trim() || 'Shop Now',
        bgGradient:  form.bgGradient,
        imageUrl:    form.imageUrl,
        videoUrl:    form.videoUrl,
        screenshot1: form.screenshot1,
        screenshot2: form.screenshot2,
        linkUrl:     form.linkUrl.trim() || '/',
        isActive:    form.isActive,
        position:    form.position,
      };

      let res: Response;
      if (editId) {
        res = await fetch(`/api/admin/banners/${editId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/banners', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' })) as { error?: string };
        setError(err.error ?? 'Save failed. Please try again.');
        return;
      }
      setShowForm(false);
      await fetchBanners();
    } catch (e) {
      console.error('Banner save error:', e);
      setError('Save failed. Please try again.');
    }
    finally { setSaving(false); }
  }

  async function toggleActive(b: BannerRow) {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
      setBanners((prev) => prev.filter((x) => x.id !== id));
    } finally { setDeletingId(null); }
  }

  async function moveOrder(b: BannerRow, dir: 'up' | 'down') {
    const idx  = banners.findIndex((x) => x.id === b.id);
    const swap = dir === 'up' ? banners[idx - 1] : banners[idx + 1];
    if (!swap) return;
    await Promise.all([
      fetch(`/api/admin/banners/${b.id}`,    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: swap.sortOrder }) }),
      fetch(`/api/admin/banners/${swap.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: b.sortOrder }) }),
    ]);
    await fetchBanners();
  }

  /* ── helpers ── */
  function ScreenshotSlot({ value, onClear, onBrowse, label }: { value: string; onClear: () => void; onBrowse: () => void; label: string }) {
    return (
      <div
        className={cn(
          'relative flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
          value ? 'border-emerald-300 bg-emerald-50' : 'border-neutral-200 bg-neutral-50 hover:border-primary-300',
        )}
        onClick={onBrowse}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="absolute inset-0 h-full w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            <Camera className="h-6 w-6 text-neutral-300" />
            <p className="mt-1 text-xs text-neutral-400">{label}</p>
          </>
        )}
      </div>
    );
  }

  /* ── render ── */
  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Banners &amp; Ads</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage homepage hero slider — images, videos &amp; screenshots</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      {/* Live preview notice */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3">
        <span className="text-lg">🖼️</span>
        <p className="text-sm text-primary-700">
          <strong>Live:</strong> Active banners appear instantly on the homepage slider. Supports image, video, and up to 2 screenshots.
        </p>
        <a href="/" target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline">
          Preview <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Banner list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
          <ImagePlus className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="font-semibold text-neutral-600">No banners yet</p>
          <p className="mt-1 text-sm text-neutral-400">Add your first banner to appear on the homepage.</p>
          <button onClick={openCreate} className="mt-4 rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white hover:bg-primary-700">
            + Add Banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => {
            const ex = parseExtra(b.altText);
            return (
              <div key={b.id} className={cn(
                'flex items-center gap-4 rounded-2xl border bg-white p-3 shadow-sm transition-all',
                b.isActive ? 'border-neutral-100' : 'border-neutral-100 opacity-60',
              )}>
                {/* Order arrows */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveOrder(b, 'up')} disabled={idx === 0} className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => moveOrder(b, 'down')} disabled={idx === banners.length - 1} className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Thumbnail / video badge */}
                <div className={cn('relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-xl', `bg-gradient-to-br ${ex.bgGradient}`)}>
                  {ex.videoUrl ? (
                    <>
                      {/* Show first frame via video element */}
                      <video src={ex.videoUrl} className="absolute inset-0 h-full w-full object-cover rounded-xl" muted playsInline />
                      <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
                        <Video className="h-2.5 w-2.5" /> VIDEO
                      </span>
                    </>
                  ) : b.imageUrl ? (
                    b.imageUrl.startsWith('data:')
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={b.imageUrl} alt={b.title} className="absolute inset-0 h-full w-full object-cover rounded-xl" />
                      : <Image src={b.imageUrl} alt={b.title} fill sizes="112px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs font-bold text-white/70">No Media</span>
                    </div>
                  )}
                  {/* Screenshot badges */}
                  {(ex.screenshot1 || ex.screenshot2) && (
                    <span className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">
                      <Camera className="h-2.5 w-2.5" />
                      {[ex.screenshot1, ex.screenshot2].filter(Boolean).length}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-neutral-900 truncate">{ex.headline || b.title}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', b.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500')}>
                      {b.isActive ? 'Live' : 'Hidden'}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                      {b.position === 'promo' ? 'Promo' : 'Hero'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{ex.subtitle || '—'}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    Badge: {b.title} · CTA: {ex.ctaText} → {b.linkUrl ?? '/'}
                    {ex.videoUrl && <span className="ml-2 text-indigo-500">📹 Video</span>}
                    {ex.screenshot1 && <span className="ml-2 text-emerald-500">📸 {[ex.screenshot1, ex.screenshot2].filter(Boolean).length} screenshot(s)</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(b)} title={b.isActive ? 'Hide banner' : 'Show banner'} className="text-neutral-400 hover:text-neutral-700">
                    {b.isActive ? <ToggleRight className="h-6 w-6 text-primary-500" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                  <button onClick={() => openEdit(b)} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deletingId === b.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-400 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit form modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" style={{ maxHeight: '92vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <h2 className="text-base font-black text-neutral-900">{editId ? 'Edit Banner' : 'Add New Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* ── Media Section ── */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">Banner Media</label>

                {/* Tab switcher: Image | Video */}
                <div className="mb-3 flex gap-2">
                  {(['image', 'video'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setMediaTab(tab)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors',
                        mediaTab === tab ? 'bg-primary-600 text-white' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                      )}
                    >
                      {tab === 'image' ? <ImagePlus className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                      {tab === 'image' ? 'Image' : 'Video'}
                    </button>
                  ))}
                </div>

                {mediaTab === 'image' ? (
                  <div>
                    {/* Image upload zone */}
                    <div
                      className={cn(
                        'relative flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors',
                        form.imageUrl ? 'border-primary-300 bg-primary-50' : 'border-neutral-200 bg-neutral-50 hover:border-primary-300 hover:bg-primary-50',
                        uploading ? 'pointer-events-none opacity-70' : '',
                      )}
                      onClick={() => !uploading && imgRef.current?.click()}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
                          <p className="text-xs font-semibold text-primary-600">Uploading…</p>
                        </div>
                      ) : form.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.imageUrl} alt="Preview" className="absolute inset-0 h-full w-full rounded-2xl object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, imageUrl: '' })); }}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-8 w-8 text-neutral-400" />
                          <p className="mt-2 text-sm font-semibold text-neutral-600">Click to upload image</p>
                          <p className="text-xs text-neutral-400">PNG, JPG, WebP · max 5 MB</p>
                        </>
                      )}
                      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageFile(e)} />
                    </div>
                    {/* URL fallback */}
                    <div className="mt-2">
                      <input
                        type="url"
                        value={form.imageUrl.startsWith('data:') ? '' : form.imageUrl}
                        onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="…or paste an image URL"
                        className={cn(inputCls, 'text-xs')}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Video upload zone */}
                    <div
                      className={cn(
                        'relative flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors',
                        form.videoUrl ? 'border-indigo-300 bg-indigo-50' : 'border-neutral-200 bg-neutral-50 hover:border-indigo-300 hover:bg-indigo-50',
                        uploading ? 'pointer-events-none opacity-70' : '',
                      )}
                      onClick={() => !uploading && vidRef.current?.click()}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                          <p className="text-xs font-semibold text-indigo-600">Uploading video…</p>
                        </div>
                      ) : form.videoUrl ? (
                        <>
                          <video src={form.videoUrl} className="absolute inset-0 h-full w-full rounded-2xl object-cover" muted autoPlay loop playsInline />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, videoUrl: '' })); }}
                            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <span className="absolute bottom-2 left-2 z-10 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">VIDEO</span>
                        </>
                      ) : (
                        <>
                          <Video className="h-8 w-8 text-neutral-400" />
                          <p className="mt-2 text-sm font-semibold text-neutral-600">Click to upload video</p>
                          <p className="text-xs text-neutral-400">MP4, WebM · max 50 MB</p>
                        </>
                      )}
                      <input ref={vidRef} type="file" accept="video/mp4,video/webm,video/*" className="hidden" onChange={(e) => void handleVideoFile(e)} />
                    </div>
                    {/* Video URL fallback */}
                    <div className="mt-2">
                      <input
                        type="url"
                        value={form.videoUrl.startsWith('data:') ? '' : form.videoUrl}
                        onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                        placeholder="…or paste a video URL (YouTube embed, CDN link…)"
                        className={cn(inputCls, 'text-xs')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Screenshots (2 slots) ── */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">
                  <span className="flex items-center gap-1.5"><Camera className="h-4 w-4 text-neutral-400" /> Screenshots <span className="text-xs font-normal text-neutral-400">(optional, max 2)</span></span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <ScreenshotSlot
                    value={form.screenshot1}
                    label="Screenshot 1"
                    onBrowse={() => ss1Ref.current?.click()}
                    onClear={() => setForm((f) => ({ ...f, screenshot1: '' }))}
                  />
                  <ScreenshotSlot
                    value={form.screenshot2}
                    label="Screenshot 2"
                    onBrowse={() => ss2Ref.current?.click()}
                    onClear={() => setForm((f) => ({ ...f, screenshot2: '' }))}
                  />
                </div>
                <input ref={ss1Ref} type="file" accept="image/*" className="hidden" onChange={(e) => void handleScreenshot(e, 1)} />
                <input ref={ss2Ref} type="file" accept="image/*" className="hidden" onChange={(e) => void handleScreenshot(e, 2)} />
              </div>

              {/* Badge label */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Badge Label</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="🌾 Farmers Factory" className={inputCls} />
                <p className="mt-1 text-xs text-neutral-400">Short label shown as a pill on the banner</p>
              </div>

              {/* Headline */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Headline</label>
                <input type="text" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder="Farm-to-Door Freshness" className={inputCls} />
              </div>

              {/* Subtitle */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Organic vegetables direct from Karnataka farms" className={inputCls} />
              </div>

              {/* CTA + Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Button Text</label>
                  <input type="text" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} placeholder="Shop Now" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Button Link</label>
                  <input type="text" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="/category/farm-fresh" className={inputCls} />
                </div>
              </div>

              {/* Background gradient */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">Background Colour</label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, bgGradient: g.value }))}
                      className={cn(
                        'flex h-12 items-center justify-center rounded-xl border-2 text-xs font-bold text-white transition-all',
                        `bg-gradient-to-br ${g.value}`,
                        form.bgGradient === g.value ? 'border-neutral-900 scale-105 shadow-md' : 'border-transparent',
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position picker */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">Banner Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'hero',  label: 'Hero Slider',   desc: 'Full-width top slider' },
                    { value: 'promo', label: 'Promo Banner',  desc: '2-up section below categories' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, position: opt.value }))}
                      className={cn(
                        'flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all',
                        form.position === opt.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300',
                      )}
                    >
                      <span className="text-sm font-bold text-neutral-900">{opt.label}</span>
                      <span className="text-xs text-neutral-500">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  {form.isActive
                    ? (
                      <>
                        <ToggleRight className="h-6 w-6 text-primary-500" />
                        <span className="text-primary-700">Visible on homepage</span>
                      </>
                    )
                    : (
                      <>
                        <ToggleLeft className="h-6 w-6 text-neutral-400" />
                        <span className="text-neutral-500">Hidden from homepage</span>
                      </>
                    )}
                </button>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-neutral-100 px-5 py-4">
              <button
                onClick={() => void handleSave()}
                disabled={saving || uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {uploading ? 'Uploading…' : saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Banner'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
