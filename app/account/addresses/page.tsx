'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Trash2, Check, Navigation, Loader2, Home, Briefcase, Edit3, X, ArrowLeft } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAddressStore } from '@/store/addressStore';
import { useLocationStore } from '@/store/locationStore';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const inputCls =
  'h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

interface DbAddress {
  id: string; label: string; line1: string; line2?: string | null;
  landmark?: string | null; city: string; state: string; pincode: string;
  lat: number; lng: number; isDefault: boolean; createdAt: string;
}

interface AddrForm {
  label: string; line1: string; line2: string;
  city: string; state: string; pincode: string; lat: number; lng: number;
}

const emptyForm = (): AddrForm => ({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', lat: 0, lng: 0 });

export default function AddressesPage() {
  const router       = useRouter();
  const user         = useUserStore((s) => s.user);
  const savedAddr    = useAddressStore((s) => s.address);
  const setSavedAddr = useAddressStore((s) => s.setAddress);
  const setLocation  = useLocationStore((s) => s.setLocation);

  const [addresses,   setAddresses]   = useState<DbAddress[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState<AddrForm>(emptyForm());
  const [saving,      setSaving]      = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [formError,   setFormError]   = useState('');

  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;
    setLoadingAddr(true);
    try {
      const res  = await fetch(`/api/user/addresses?userId=${user.id}`);
      const data = await res.json() as { data: DbAddress[] };
      setAddresses(data.data ?? []);
    } finally {
      setLoadingAddr(false);
    }
  }, [user?.id]);

  useEffect(() => { void fetchAddresses(); }, [fetchAddresses]);

  const detectGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/location/reverse-geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          if (res.ok) {
            const d = await res.json() as { address: string; city: string; state: string; pincode: string };
            setForm((f) => ({ ...f, line1: d.address, city: d.city, state: d.state, pincode: d.pincode, lat: pos.coords.latitude, lng: pos.coords.longitude }));
          }
        } finally { setGpsLoading(false); }
      },
      () => setGpsLoading(false),
      { timeout: 12000, enableHighAccuracy: true },
    );
  };

  const handleSave = async () => {
    if (!form.line1 || !form.city || !form.pincode) {
      setFormError('Address, city, and pincode are required.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      if (editId) {
        await fetch(`/api/user/addresses/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, ...form }),
        });
      } else {
        await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, ...form, isDefault: addresses.length === 0 }),
        });
      }
      if (addresses.length === 0 || editId === null) {
        setSavedAddr({ fullName: user?.name ?? '', phone: user?.phone ?? '', ...form });
      }
      await fetchAddresses();
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm());
    } catch {
      setFormError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
    await fetchAddresses();
  };

  const handleSetDefault = async (addr: DbAddress) => {
    await fetch(`/api/user/addresses/${addr.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, isDefault: true }),
    });
    setSavedAddr({ fullName: user?.name ?? '', phone: user?.phone ?? '', line1: addr.line1, city: addr.city, state: addr.state, pincode: addr.pincode, lat: addr.lat, lng: addr.lng, label: addr.label });
    setLocation({ lat: addr.lat || 13.0827, lng: addr.lng || 80.2707, address: `${addr.line1}, ${addr.city}`, pincode: addr.pincode, city: addr.city });
    await fetchAddresses();
  };

  const openEdit = (addr: DbAddress) => {
    setForm({ label: addr.label, line1: addr.line1, line2: addr.line2 ?? '', city: addr.city, state: addr.state, pincode: addr.pincode, lat: addr.lat, lng: addr.lng });
    setEditId(addr.id);
    setShowForm(true);
    setFormError('');
  };

  const field = (k: keyof AddrForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] pb-32">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-100 bg-white px-4 py-4 shadow-sm">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200">
            <ArrowLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-black text-neutral-900">Saved Addresses</h1>
        </div>
        <div className="mx-auto max-w-lg px-4 py-8 text-center">
          <MapPin className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
          <p className="font-bold text-neutral-700">Please log in to manage addresses.</p>
          {savedAddr && (
            <div className="mt-4 rounded-xl border border-neutral-100 bg-white p-4 text-left shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-400">Saved Locally</p>
              <p className="font-semibold text-neutral-800">{savedAddr.label ?? 'Home'}</p>
              <p className="text-sm text-neutral-600">{savedAddr.line1}, {savedAddr.city} - {savedAddr.pincode}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-90 transition-all">
            <ArrowLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <h1 className="text-base font-black text-neutral-900">Saved Addresses</h1>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true); setFormError(''); }}
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white hover:bg-primary-700 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Add New
        </button>
      </div>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">

        {/* Add / Edit form */}
        {showForm && (
          <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-neutral-900">{editId ? 'Edit Address' : 'New Address'}</p>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="rounded-lg p-1 hover:bg-neutral-100">
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>

            {/* GPS button */}
            <button onClick={detectGPS} disabled={gpsLoading}
              className="mb-3 flex w-full items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2.5 text-xs font-bold text-primary-700 disabled:opacity-60 active:scale-[0.98] transition-all">
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              {gpsLoading ? 'Detecting location...' : 'Auto-fill with GPS'}
            </button>

            {/* Label picker */}
            <div className="mb-3 flex gap-2">
              {[{ l: 'Home', icon: Home }, { l: 'Work', icon: Briefcase }, { l: 'Other', icon: MapPin }].map(({ l, icon: Icon }) => (
                <button key={l} type="button" onClick={() => setForm((f) => ({ ...f, label: l }))}
                  className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-colors',
                    form.label === l ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300')}>
                  <Icon className="h-3.5 w-3.5" />{l}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-500">House / Flat / Street *</label>
                <input className={inputCls} placeholder="42B, 3rd Street, Anna Nagar" value={form.line1} onChange={field('line1')} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-500">Landmark</label>
                <input className={inputCls} placeholder="Near bus stop, temple..." value={form.line2} onChange={field('line2')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-neutral-500">City *</label>
                  <input className={inputCls} placeholder="Chennai" value={form.city} onChange={field('city')} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-neutral-500">Pincode *</label>
                  <input className={inputCls} placeholder="600001" inputMode="numeric" maxLength={6} value={form.pincode} onChange={field('pincode')} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-500">State</label>
                <input className={inputCls} placeholder="Tamil Nadu" value={form.state} onChange={field('state')} />
              </div>
            </div>

            {formError && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</p>}

            <button onClick={() => void handleSave()} disabled={saving}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving...' : editId ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        )}

        {/* Address list */}
        {loadingAddr ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />)}
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center shadow-sm">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
            <p className="font-bold text-neutral-600">No saved addresses yet</p>
            <p className="mt-1 text-sm text-neutral-400">Add one to speed up checkout.</p>
            <button
              onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true); }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" /> Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className={cn('rounded-2xl border bg-white p-4 shadow-sm transition-all', addr.isDefault ? 'border-primary-200 ring-1 ring-primary-100' : 'border-neutral-100')}>
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', addr.isDefault ? 'bg-primary-50' : 'bg-neutral-100')}>
                    {addr.label === 'Work'
                      ? <Briefcase className={cn('h-5 w-5', addr.isDefault ? 'text-primary-600' : 'text-neutral-500')} />
                      : addr.label === 'Other'
                      ? <MapPin className={cn('h-5 w-5', addr.isDefault ? 'text-primary-600' : 'text-neutral-500')} />
                      : <Home className={cn('h-5 w-5', addr.isDefault ? 'text-primary-600' : 'text-neutral-500')} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-neutral-900">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-700">{addr.line1}</p>
                    {addr.line2 && <p className="text-xs text-neutral-500">{addr.line2}</p>}
                    <p className="text-xs text-neutral-500">{addr.city}{addr.state ? ', ' + addr.state : ''} - {addr.pincode}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-neutral-50 pt-3">
                  {!addr.isDefault && (
                    <button onClick={() => void handleSetDefault(addr)}
                      className="flex-1 rounded-xl border border-primary-200 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50 transition-colors">
                      Set as Default
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)}
                    className="flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => void handleDelete(addr.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
