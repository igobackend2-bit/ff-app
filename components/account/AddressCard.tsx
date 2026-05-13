'use client';

import { useState } from 'react';
import { MapPin, Navigation, Edit3, Check, X, Loader2 } from 'lucide-react';
import { useAddressStore, type SavedAddress } from '@/store/addressStore';
import { cn } from '@/lib/utils';

const inputCls =
  'h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm ' +
  'text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-100';

async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } },
  );
  const d = await res.json() as { address: Record<string, string>; display_name?: string };
  const a = d.address;
  return {
    line1:   [a.road, a.suburb, a.neighbourhood].filter(Boolean).join(', ') || a.display_name?.split(',')[0] || '',
    city:    a.city ?? a.town ?? a.county ?? '',
    state:   a.state ?? '',
    pincode: a.postcode ?? '',
  };
}

export function AddressCard({ compact = false }: { compact?: boolean }) {
  const { address, setAddress } = useAddressStore();
  const [editing, setEditing]   = useState(!address);
  const [gpsLoading, setGps]    = useState(false);
  const [form, setForm]         = useState<SavedAddress>(
    address ?? { fullName: '', phone: '', line1: '', city: '', state: '', pincode: '' },
  );

  const field = (k: keyof SavedAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const detectGPS = () => {
    if (!navigator.geolocation) return;
    setGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setForm((f) => ({
            ...f,
            ...geo,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }));
        } finally {
          setGps(false);
        }
      },
      () => setGps(false),
      { timeout: 10000 },
    );
  };

  const handleSave = () => {
    if (!form.fullName || !form.phone || !form.line1 || !form.city || !form.pincode) return;
    setAddress(form);
    setEditing(false);
  };

  if (!editing && address) {
    return (
      <div className={cn('rounded-2xl border border-neutral-200 bg-white shadow-sm', compact ? 'p-4' : 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <MapPin className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {address.label ?? 'Delivery Address'}
              </p>
              <p className="mt-0.5 font-bold text-neutral-900">{address.fullName}</p>
              <p className="text-sm text-neutral-600">{address.line1}</p>
              <p className="text-sm text-neutral-500">
                {address.city}, {address.state} – {address.pincode}
              </p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">📞 {address.phone}</p>
            </div>
          </div>
          <button
            onClick={() => { setForm(address); setEditing(true); }}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
          >
            <Edit3 className="h-3 w-3" /> Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-primary-100 bg-white shadow-sm', compact ? 'p-4' : 'p-5')}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-bold text-neutral-900">
            {address ? 'Edit Address' : 'Set Delivery Address'}
          </span>
        </div>
        <button
          onClick={detectGPS}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 disabled:opacity-60"
        >
          {gpsLoading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Navigation className="h-3 w-3" />}
          {gpsLoading ? 'Detecting…' : 'Use GPS'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Full Name *</label>
          <input className={inputCls} placeholder="Your name" value={form.fullName} onChange={field('fullName')} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Phone *</label>
          <input className={inputCls} placeholder="10-digit number" inputMode="numeric" maxLength={10} value={form.phone} onChange={field('phone')} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Address Line *</label>
          <input className={inputCls} placeholder="Flat / House No, Street, Area" value={form.line1} onChange={field('line1')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">City *</label>
          <input className={inputCls} placeholder="Chennai" value={form.city} onChange={field('city')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">State</label>
          <input className={inputCls} placeholder="Tamil Nadu" value={form.state} onChange={field('state')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Pincode *</label>
          <input className={inputCls} placeholder="600001" inputMode="numeric" maxLength={6} value={form.pincode} onChange={field('pincode')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-500">Label</label>
          <div className="flex gap-2">
            {['Home', 'Work', 'Other'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setForm((f) => ({ ...f, label: l }))}
                className={cn(
                  'flex-1 rounded-lg border py-2 text-xs font-bold transition-colors',
                  form.label === l
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-300',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700"
        >
          <Check className="h-4 w-4" /> Save Address
        </button>
        {address && (
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
