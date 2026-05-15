'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ToggleLeft, ToggleRight, Upload, X, ImageIcon, Plus, Play, Video } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string; name: string; slug: string; description: string | null;
  price: number; mrp: number; unit: string; inStock: boolean; isFeatured: boolean;
  tags: string[]; imageUrls: string[];
  averageRating: number; reviewCount: number;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
}

// Detect if a URL is a video
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('youtube.com/watch') || u.includes('youtu.be/') ||
    u.includes('vimeo.com/') ||
    u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.ogg') || u.endsWith('.mov')
  );
}

function getYoutubeThumbnail(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : '';
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered ?? value) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="text-2xl transition-transform hover:scale-110"
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <span className={filled ? 'text-yellow-400' : 'text-neutral-200'}>★</span>
          </button>
        );
      })}
      <span className="ml-2 text-sm font-bold text-neutral-700">
        {value > 0 ? value.toFixed(1) : 'No rating'}
      </span>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-neutral-700">{label}</label>
    {children}
  </div>
);

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [product,     setProduct]     = useState<Product | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState('');
  const [uploadError, setUploadError] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', price: '', mrp: '', unit: '',
    tags: '', imageUrls: [] as string[], inStock: true, isFeatured: false,
    averageRating: 0, reviewCount: 0, sortOrder: 0,
  });

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((d: { product?: Product }) => {
        const p = d.product;
        if (!p) return;
        setProduct(p);
        setForm({
          name:          p.name,
          description:   p.description ?? '',
          price:         String(p.price),
          mrp:           String(p.mrp),
          unit:          p.unit,
          tags:          (p.tags ?? []).join(', '),
          imageUrls:     p.imageUrls ?? [],
          inStock:       p.inStock,
          isFeatured:    p.isFeatured,
          averageRating: p.averageRating ?? 0,
          reviewCount:   p.reviewCount ?? 0,
          sortOrder:     0,
        });
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const allowedImages = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideos = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    for (const file of files) {
      const isImg = allowedImages.includes(file.type);
      const isVid = allowedVideos.includes(file.type);
      if (!isImg && !isVid) { setUploadError('Only images (JPG, PNG, WebP, GIF) or videos (MP4, WebM, MOV) allowed.'); return; }
      if (isImg && file.size > 5 * 1024 * 1024) { setUploadError('Each image must be under 5 MB.'); return; }
      if (isVid && file.size > 50 * 1024 * 1024) { setUploadError('Each video must be under 50 MB.'); return; }
    }

    setUploadError('');
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res  = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
        const data = await res.json() as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
        newUrls.push(data.url);
      }
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...newUrls].slice(0, 8) }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name,
          description:   form.description,
          price:         Number(form.price),
          mrp:           form.mrp ? Number(form.mrp) : Number(form.price),
          unit:          form.unit,
          tags:          form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          imageUrls:     form.imageUrls.filter(Boolean),
          inStock:       form.inStock,
          isFeatured:    form.isFeatured,
          averageRating: form.averageRating,
          reviewCount:   form.reviewCount,
          sortOrder:     form.sortOrder,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? 'Failed to save');
      }
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Edit Product</h1>
          <p className="text-sm text-neutral-500">{product?.name}</p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">

        {/* Basic Information */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Basic Information</h2>
          <div className="space-y-4">
            <Field label="Product Name *">
              <input type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls} required />
            </Field>
            <Field label="Description">
              <textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Pricing & Unit</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Selling Price (Rs.) *">
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={inputCls} required />
            </Field>
            <Field label="MRP (Rs.)">
              <input type="number" min="0" step="0.01" value={form.mrp}
                onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
                className={inputCls} />
            </Field>
            <Field label="Unit *">
              <input type="text" value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="500 gm, 1 Kg..." className={inputCls} required />
            </Field>
          </div>
        </div>

        {/* Images & Tags */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Images & Tags</h2>
          <div className="space-y-4">

            {/* Image grid */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Product Images ({form.imageUrls.length}/8)
              </label>
              <div className="flex flex-wrap gap-3">
                {form.imageUrls.map((url, idx) => {
                  const isVid = isVideoUrl(url);
                  const ytThumb = isVid ? getYoutubeThumbnail(url) : '';
                  return (
                    <div key={idx} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                      {isVid ? (
                        <>
                          {ytThumb ? (
                            <img src={ytThumb} alt="video thumbnail" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-neutral-800">
                              <Video className="h-8 w-8 text-white opacity-70" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60">
                              <Play className="h-4 w-4 fill-white text-white" />
                            </div>
                          </div>
                          <span className="absolute bottom-0 left-0 right-0 bg-purple-600 py-0.5 text-center text-[9px] font-bold text-white">VIDEO</span>
                        </>
                      ) : (
                        <>
                          <img src={url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary-600 py-0.5 text-center text-[9px] font-bold text-white">
                              MAIN
                            </span>
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }))}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Add image button */}
                {form.imageUrls.length < 8 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-60"
                  >
                    {uploading
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <span className="flex flex-col items-center"><Plus className="h-5 w-5" /><span className="mt-1 text-[10px] font-semibold">Add Image</span></span>}
                  </button>
                )}
              </div>
              <input
                ref={fileRef} type="file" accept="image/*,video/*" multiple
                className="hidden" onChange={(e) => void handleFileUpload(e)}
              />
              {uploadError && <p className="mt-1.5 text-xs font-medium text-red-600">{uploadError}</p>}
              <p className="mt-1.5 text-[11px] text-neutral-400">
                First image = main/cover. Max 8 images. Click an image and hover for × to remove.
              </p>
            </div>

            {/* Image URL input */}
            <Field label="Or add image by URL / local path">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  type="text"
                  placeholder="/images/vegtables/Brinjal.jfif  or  https://..."
                  className={inputCls}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && form.imageUrls.length < 8) {
                        setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, val] }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">Press Enter to add the URL as an image</p>
            </Field>

            {/* Video URL input */}
            <Field label="Add Product Video (YouTube / MP4 URL)">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 shrink-0 text-purple-400" />
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=... or https://.../video.mp4"
                  className={inputCls}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && isVideoUrl(val) && form.imageUrls.length < 8) {
                        setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, val] }));
                        (e.target as HTMLInputElement).value = '';
                      } else if (val && !isVideoUrl(val)) {
                        alert('Please enter a valid YouTube or video URL (.mp4, .webm, etc.)');
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                Press Enter to add. Video will appear with a ▶ badge in the image grid.
                Supports YouTube, Vimeo, MP4, WEBM.
              </p>
            </Field>

            <Field label="Tags (comma separated)">
              <input type="text" value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="organic, fresh, bestseller" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Ratings */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Rating & Reviews</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">Average Rating (Admin Override)</label>
              <StarRating
                value={form.averageRating}
                onChange={(v) => setForm((f) => ({ ...f, averageRating: v }))}
              />
              <p className="mt-1 text-[11px] text-neutral-400">Click a star to set the displayed rating. Click again to clear.</p>
            </div>
            <Field label="Review Count">
              <input
                type="number" min="0" value={form.reviewCount}
                onChange={(e) => setForm((f) => ({ ...f, reviewCount: Number(e.target.value) }))}
                placeholder="0" className={inputCls}
              />
            </Field>
            <Field label="Sort Order (lower = first in category)">
              <input
                type="number" min="0" value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                placeholder="0 = first, 10 = later"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-neutral-400">
                Set 0 for onion/tomato/potato to show them first. Run
                <a href="/api/admin/setup-sort" target="_blank" className="ml-1 text-primary-600 underline">setup-sort</a>
                {' '}once to activate this feature.
              </p>
            </Field>
          </div>
        </div>

        {/* Availability */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Availability</h2>
          <div className="flex gap-6">
            <button type="button" onClick={() => setForm((f) => ({ ...f, inStock: !f.inStock }))}
              className="flex items-center gap-2.5 text-sm font-semibold">
              {form.inStock
                ? <span className="flex items-center gap-2.5"><ToggleRight className="h-6 w-6 text-primary-500" /><span className="text-primary-700">In Stock</span></span>
                : <span className="flex items-center gap-2.5"><ToggleLeft className="h-6 w-6 text-red-400" /><span className="text-red-600">Out of Stock</span></span>}
            </button>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="h-4 w-4 accent-primary-600" />
              <span className="text-sm font-semibold text-neutral-700">Featured</span>
            </label>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link
            href="/admin/products"
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
