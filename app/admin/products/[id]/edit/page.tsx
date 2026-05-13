'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ToggleLeft, ToggleRight, Upload, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string; name: string; slug: string; description: string | null;
  price: number; mrp: number; unit: string; inStock: boolean; isFeatured: boolean;
  tags: string[]; imageUrls: string[];
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
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
    tags: '', imageUrl: '', inStock: true, isFeatured: false,
  });

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((d: { product?: Product }) => {
        const p = d.product;
        if (!p) return;
        setProduct(p);
        setForm({
          name:        p.name,
          description: p.description ?? '',
          price:       String(p.price),
          mrp:         String(p.mrp),
          unit:        p.unit,
          tags:        (p.tags ?? []).join(', '),
          imageUrl:    p.imageUrls?.[0] ?? '',
          inStock:     p.inStock,
          isFeatured:  p.isFeatured,
        });
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG, PNG, WebP or GIF images allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5 MB.');
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed');
      setForm((f) => ({ ...f, imageUrl: data.url! }));
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
          name:        form.name,
          description: form.description,
          price:       Number(form.price),
          mrp:         form.mrp ? Number(form.mrp) : Number(form.price),
          unit:        form.unit,
          tags:        form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          imageUrls:   form.imageUrl ? [form.imageUrl] : [],
          inStock:     form.inStock,
          isFeatured:  form.isFeatured,
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

        {/* Image & Tags */}
        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Image & Tags</h2>
          <div className="space-y-4">

            {/* Image preview */}
            {form.imageUrl && (
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
                <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Upload file button */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Upload Image File</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 transition-colors">
                  {uploading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                    : <><Upload className="h-4 w-4" /> Choose Image</>}
                </button>
                <span className="text-xs text-neutral-400">JPG, PNG, WebP — max 5 MB</span>
              </div>
              <input
                ref={fileRef} type="file" accept="image/*"
                className="hidden" onChange={(e) => void handleFileUpload(e)}
              />
              {uploadError && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{uploadError}</p>
              )}
            </div>

            {/* Or enter URL / local path */}
            <Field label="Or enter Image URL / local path">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0 text-neutral-400" />
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="/images/vegtables/Brinjal.jfif  or  https://..."
                  className={inputCls}
                />
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">Local paths like /images/... are accepted</p>
            </Field>

            <Field label="Tags (comma separated)">
              <input type="text" value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="organic, fresh, bestseller" className={inputCls} />
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
                ? <><ToggleRight className="h-6 w-6 text-primary-500" /><span className="text-primary-700">In Stock</span></>
                : <><ToggleLeft className="h-6 w-6 text-red-400" /><span className="text-red-600">Out of Stock</span></>}
            </button>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="h-4 w-4 accent-primary-600" />
              <span className="text-sm font-semibold text-neutral-700">Featured</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/products"
            className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}
