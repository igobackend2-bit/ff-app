'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Category { id: string; name: string; slug: string; }
interface Brand { id: string; name: string; slug: string; }

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', slug: '', description: '', categorySlug: '',
    brandSlug: '', price: '', mrp: '', unit: '',
    tags: '', imageUrl: '', inStock: true, isFeatured: false,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/admin/products?limit=1').then(() => []), // just to warm up; brands come from separate endpoint
    ]).then(([catData]) => {
      setCategories((catData as { categories: Category[] }).categories ?? []);
    }).catch(console.error);

    // Also fetch brands directly from products list
    fetch('/api/admin/products?limit=1').catch(() => null);
  }, []);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
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
          imageUrls: form.imageUrl ? [form.imageUrl] : [],
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

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-neutral-700">{label}</label>
      {children}
    </div>
  );

  const inputCls = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';

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

        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-neutral-700">Image & Tags</h2>
          <div className="space-y-4">
            <Field label="Image URL">
              <input type="url" value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..." className={inputCls} />
            </Field>
            <Field label="Tags (comma separated)">
              <input type="text" value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="organic, fresh, bestseller" className={inputCls} />
            </Field>
          </div>
        </div>

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
            disabled={saving}
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
