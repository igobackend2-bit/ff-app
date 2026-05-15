'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Upload, X, ImageIcon, Play, Film } from 'lucide-react';
import Link from 'next/link';

interface Category { id: string; name: string; slug: string; }

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-neutral-700">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';

function isVideoUrl(url: string) {
  const u = url.toLowerCase();
  return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.ogg') || u.endsWith('.mov') ||
    u.includes('/videos/');
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', categorySlug: '',
    brandSlug: '', price: '', mrp: '', unit: '',
    tags: '', inStock: true, isFeatured: false,
  });

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories((d as { data: Category[] }).data ?? []))
      .catch(console.error);
  }, []);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);

    const results: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (!isImg && !isVid) { setError(`Skipped ${file.name}: only images and videos allowed.`); continue; }
      if (isImg && file.size > 5 * 1024 * 1024) { setError(`${file.name} too large (max 5 MB for images).`); continue; }
      if (isVid && file.size > 50 * 1024 * 1024) { setError(`${file.name} too large (max 50 MB for videos).`); continue; }

      setUploadProgress(`Uploading ${i + 1} of ${files.length}…`);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (data.ok && data.url) {
        results.push(data.url);
      } else {
        setError(`Upload failed for ${file.name}: ${data.error ?? 'Unknown error'}`);
      }
    }

    setMediaUrls((prev) => [...prev, ...results]);
    setUploading(false);
    setUploadProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  };

  const removeMedia = (idx: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.price || !form.unit) {
      setError('Name, price and unit are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          mrp: form.mrp ? Number(form.mrp) : Number(form.price),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          imageUrls: mediaUrls,
          blurDataUrls: [],
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Failed to create product');
      }
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/products" className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Add Product</h1>
          <p className="text-sm text-neutral-500">Add a new product to the catalog</p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Basic Info */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Basic Information</h2>
          <div className="space-y-4">
            <Field label="Product Name *">
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Organic Tomatoes" className={inputCls} required />
            </Field>
            <Field label="Slug (URL)">
              <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="auto-generated from name" className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Short product description..." className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Category & Brand */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Category & Brand</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.categorySlug} onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
                className={inputCls}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Brand">
              <select value={form.brandSlug} onChange={(e) => setForm((f) => ({ ...f, brandSlug: e.target.value }))}
                className={inputCls}>
                <option value="">No brand</option>
                <option value="farmers-factory">Farmers Factory</option>
                <option value="valluvam-products">Valluvam Products</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Pricing & Unit</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Selling Price (₹) *">
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="99" className={inputCls} required />
            </Field>
            <Field label="MRP (₹)">
              <input type="number" min="0" step="0.01" value={form.mrp}
                onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
                placeholder="Leave blank = same as price" className={inputCls} />
            </Field>
            <Field label="Unit *">
              <input type="text" value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="e.g. 500g, 1 kg, 1 L" className={inputCls} required />
            </Field>
          </div>
        </div>

        {/* Images & Videos */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-700">Images & Videos</h2>
            <span className="text-xs text-neutral-400">Images up to 5 MB · Videos up to 50 MB</span>
          </div>

          {/* Upload zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />

          {/* Preview grid */}
          {mediaUrls.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {mediaUrls.map((url, idx) => {
                const isVid = isVideoUrl(url);
                return (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                    {isVid ? (
                      <div className="flex h-full flex-col items-center justify-center gap-1">
                        <Film className="h-8 w-8 text-purple-400" />
                        <span className="text-[10px] font-bold text-purple-500">VIDEO</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    )}
                    {idx === 0 && (
                      <div className="absolute left-1.5 top-1.5 rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        MAIN
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 transition-colors hover:border-primary-400 hover:bg-primary-50/30"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                <p className="text-xs font-semibold text-neutral-500">{uploadProgress}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <ImageIcon className="h-5 w-5 text-neutral-400" />
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <Play className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-700">
                    <Upload className="mr-1 inline h-3.5 w-3.5" />Click to upload or drag & drop
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">Multiple images + videos supported · First image = main photo</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Tags</h2>
          <Field label="Tags (comma separated)">
            <input type="text" value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="organic, fresh, bestseller" className={inputCls} />
          </Field>
        </div>

        {/* Availability */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Availability</h2>
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.inStock}
                onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                className="h-4 w-4 accent-primary-600" />
              <span className="text-sm font-medium text-neutral-700">In Stock</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="h-4 w-4 accent-primary-600" />
              <span className="text-sm font-medium text-neutral-700">Featured / Flash Deal</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save Product'}
          </button>
          <Link
            href="/admin/products"
            className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
