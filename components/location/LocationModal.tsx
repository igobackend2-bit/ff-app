'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, Check, Plus, ChevronRight, Search, Loader2, ArrowLeft, Home, Briefcase } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useLocationStore } from '@/store/locationStore';
import { useAddressStore } from '@/store/addressStore';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

const POPULAR_AREAS = [
  { name: 'Anna Nagar',     pincode: '600040', city: 'Chennai' },
  { name: 'T. Nagar',       pincode: '600017', city: 'Chennai' },
  { name: 'Velachery',      pincode: '600042', city: 'Chennai' },
  { name: 'Adyar',          pincode: '600020', city: 'Chennai' },
  { name: 'Porur',          pincode: '600116', city: 'Chennai' },
  { name: 'Tambaram',       pincode: '600045', city: 'Chennai' },
  { name: 'Sholinganallur', pincode: '600119', city: 'Chennai' },
  { name: 'OMR',            pincode: '600097', city: 'Chennai' },
  { name: 'Perambur',       pincode: '600011', city: 'Chennai' },
  { name: 'Mylapore',       pincode: '600004', city: 'Chennai' },
  { name: 'Besant Nagar',   pincode: '600090', city: 'Chennai' },
  { name: 'Nungambakkam',   pincode: '600034', city: 'Chennai' },
  { name: 'Bangalore',      pincode: '560001', city: 'Bangalore' },
  { name: 'Koramangala',    pincode: '560034', city: 'Bangalore' },
  { name: 'Indiranagar',    pincode: '560038', city: 'Bangalore' },
  { name: 'Mysore',         pincode: '570001', city: 'Mysore' },
  { name: 'Coimbatore',     pincode: '641001', city: 'Coimbatore' },
  { name: 'Madurai',        pincode: '625001', city: 'Madurai' },
];

const inputCls =
  'h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';

interface AddrForm {
  label: string; line1: string; line2: string;
  city: string; state: string; pincode: string;
  lat: number; lng: number;
}

const emptyForm = (): AddrForm => ({
  label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '', lat: 0, lng: 0,
});

export function LocationModal() {
  const { isLocationModalOpen, closeLocationModal } = useUIStore();
  const { address, city, setLocation, detectLocation, isLocating } = useLocationStore();
  const savedAddress = useAddressStore((s) => s.address);
  const { setAddress: setSavedAddress } = useAddressStore();
  const user = useUserStore((s) => s.user);

  const [view, setView]         = useState<'main' | 'addAddress'>('main');
  const [areaSearch, setAreaSearch] = useState('');
  const [form, setForm]         = useState<AddrForm>(emptyForm());
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLocationModalOpen) {
      setAreaSearch('');
      setView('main');
      setTimeout(() => searchRef.current?.focus(), 150);
    }
  }, [isLocationModalOpen]);

  const handleAreaSelect = useCallback((area: { name: string; pincode: string; city: string }) => {
    setLocation({ lat: 13.0827, lng: 80.2707, address: `${area.name}, ${area.city}`, pincode: area.pincode, city: area.city });
    closeLocationModal();
  }, [setLocation, closeLocationModal]);

  const handleDetectLocation = useCallback(async () => {
    await detectLocation();
    closeLocationModal();
  }, [detectLocation, closeLocationModal]);

  const handleSavedAddress = useCallback(() => {
    if (!savedAddress) return;
    setLocation({
      lat: savedAddress.lat ?? 13.0827,
      lng: savedAddress.lng ?? 80.2707,
      address: `${savedAddress.line1}, ${savedAddress.city}`,
      pincode: savedAddress.pincode,
      city: savedAddress.city,
    });
    closeLocationModal();
  }, [savedAddress, setLocation, closeLocationModal]);

  const detectGPSForForm = () => {
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

  const field = (k: keyof AddrForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveAddress = async () => {
    if (!form.line1 || !form.city || !form.pincode) {
      setSaveError('Please fill in address, city, and pincode.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      // Always save to localStorage store
      setSavedAddress({
        fullName: user?.name ?? '',
        phone:    user?.phone ?? '',
        line1:    form.line1,
        city:     form.city,
        state:    form.state,
        pincode:  form.pincode,
        lat:      form.lat,
        lng:      form.lng,
        label:    form.label,
      });

      // If logged in, also persist to DB
      if (user?.id) {
        await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId:    user.id,
            label:     form.label,
            line1:     form.line1,
            line2:     form.line2,
            city:      form.city,
            state:     form.state,
            pincode:   form.pincode,
            lat:       form.lat,
            lng:       form.lng,
            isDefault: true,
          }),
        });
      }

      // Set as current delivery location
      setLocation({
        lat:     form.lat || 13.0827,
        lng:     form.lng || 80.2707,
        address: form.line1 + (form.city ? ', ' + form.city : ''),
        pincode: form.pincode,
        city:    form.city,
      });

      closeLocationModal();
    } catch (e) {
      setSaveError('Could not save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = areaSearch.trim()
    ? POPULAR_AREAS.filter((a) =>
        a.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
        a.city.toLowerCase().includes(areaSearch.toLowerCase()) ||
        a.pincode.includes(areaSearch))
    : POPULAR_AREAS;

  return (
    <AnimatePresence>
      {isLocationModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeLocationModal}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] overflow-hidden rounded-t-3xl bg-neutral-50 shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-neutral-200" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-neutral-100 bg-white px-4 py-3">
              {view === 'addAddress' && (
                <button onClick={() => setView('main')} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100">
                  <ArrowLeft className="h-4 w-4 text-neutral-600" />
                </button>
              )}
              <h2 className="flex-1 text-base font-black text-neutral-900">
                {view === 'addAddress' ? 'Add New Address' : 'Select Location'}
              </h2>
              <button onClick={closeLocationModal} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100">
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90dvh - 80px)' }}>

              {/* ── ADD ADDRESS FORM ── */}
              {view === 'addAddress' && (
                <div className="p-4 space-y-3">
                  {/* GPS detect */}
                  <button
                    onClick={detectGPSForForm}
                    disabled={gpsLoading}
                    className="flex w-full items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-700 disabled:opacity-60"
                  >
                    {gpsLoading
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <Navigation className="h-5 w-5" />}
                    {gpsLoading ? 'Detecting location...' : 'Auto-fill with GPS'}
                  </button>

                  {/* Label picker */}
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-neutral-500">LABEL</p>
                    <div className="flex gap-2">
                      {[
                        { l: 'Home', icon: Home },
                        { l: 'Work', icon: Briefcase },
                        { l: 'Other', icon: MapPin },
                      ].map(({ l, icon: Icon }) => (
                        <button key={l} type="button" onClick={() => setForm((f) => ({ ...f, label: l }))}
                          className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-colors',
                            form.label === l ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-500 hover:border-neutral-300')}>
                          <Icon className="h-3.5 w-3.5" />{l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address fields */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-neutral-500">House / Flat / Street *</label>
                    <input className={inputCls} placeholder="e.g. 42B, 3rd Street, Anna Nagar" value={form.line1} onChange={field('line1')} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-neutral-500">Landmark (optional)</label>
                    <input className={inputCls} placeholder="Near landmark" value={form.line2} onChange={field('line2')} />
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

                  {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{saveError}</p>}

                  <button
                    onClick={() => void handleSaveAddress()}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 py-3.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {saving ? 'Saving...' : 'Save & Deliver Here'}
                  </button>
                </div>
              )}

              {/* ── MAIN VIEW ── */}
              {view === 'main' && (
                <div className="pb-6">
                  {/* Search bar */}
                  <div className="mx-4 mt-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
                      <Search className="h-4 w-4 shrink-0 text-neutral-400" />
                      <input
                        ref={searchRef}
                        value={areaSearch}
                        onChange={(e) => setAreaSearch(e.target.value)}
                        placeholder="Search for area, street, city..."
                        className="flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Use GPS */}
                  <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-primary-100 bg-primary-50">
                    <button
                      onClick={() => void handleDetectLocation()}
                      disabled={isLocating}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary-100 disabled:opacity-60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
                        {isLocating
                          ? <Loader2 className="h-5 w-5 animate-spin text-white" />
                          : <Navigation className="h-5 w-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-800">
                          {isLocating ? 'Detecting your location...' : 'Use my Current Location'}
                        </p>
                        <p className="text-xs text-primary-600">Using GPS</p>
                      </div>
                    </button>
                  </div>

                  {/* Add New Address */}
                  <div className="mx-4 mt-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white">
                    <button
                      onClick={() => { setForm(emptyForm()); setView('addAddress'); }}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                          <Plus className="h-5 w-5 text-neutral-600" />
                        </div>
                        <p className="text-sm font-bold text-neutral-800">Add New Address</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
                    </button>
                  </div>

                  {/* Saved Address */}
                  {savedAddress && (
                    <div className="mx-4 mt-4">
                      <p className="mb-2 px-1 text-xs font-black uppercase tracking-widest text-neutral-400">Saved Address</p>
                      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
                        <button
                          onClick={handleSavedAddress}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <MapPin className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-neutral-900">{savedAddress.label ?? 'Home'}</p>
                            <p className="truncate text-xs text-neutral-500">{savedAddress.line1}, {savedAddress.city}</p>
                          </div>
                          {address?.includes(savedAddress.city) && (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="mx-4 my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-neutral-100" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      {areaSearch ? 'Search Results' : 'Popular Areas'}
                    </span>
                    <div className="h-px flex-1 bg-neutral-100" />
                  </div>

                  {/* Areas list */}
                  {filtered.length > 0 ? (
                    <div className="mx-4 overflow-hidden rounded-2xl border border-neutral-100 bg-white divide-y divide-neutral-50">
                      {filtered.map((area) => {
                        const isSelected = address?.includes(area.name);
                        return (
                          <button
                            key={`${area.name}-${area.pincode}`}
                            onClick={() => handleAreaSelect(area)}
                            className={cn(
                              'flex w-full items-center justify-between px-4 py-3 text-left transition-colors',
                              isSelected ? 'bg-primary-50' : 'hover:bg-neutral-50 active:bg-neutral-100',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className={cn('h-4 w-4 shrink-0', isSelected ? 'text-primary-600' : 'text-neutral-400')} />
                              <div>
                                <p className={cn('text-sm font-semibold', isSelected ? 'text-primary-700' : 'text-neutral-800')}>{area.name}</p>
                                <p className="text-xs text-neutral-400">{area.city} - {area.pincode}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mx-4 rounded-2xl border border-neutral-100 bg-neutral-50 py-8 text-center">
                      <p className="text-sm text-neutral-500">No areas found for "{areaSearch}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
