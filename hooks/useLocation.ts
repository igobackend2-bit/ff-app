'use client';

import { useState, useEffect } from 'react';

export interface LocationInfo {
  lat: number;
  lng: number;
  address: string;   // short human-readable: "Adyar, Chennai"
  city: string;
  state: string;
  loading: boolean;
  error: string;
}

const DEFAULT: LocationInfo = {
  lat: 0, lng: 0, address: '', city: '', state: '',
  loading: false, error: '',
};

async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string; state: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json() as {
      address: {
        suburb?: string; neighbourhood?: string; city?: string;
        town?: string; village?: string; county?: string;
        state?: string; country?: string;
      };
    };
    const a = data.address;
    const locality = a.suburb ?? a.neighbourhood ?? a.town ?? a.village ?? a.county ?? '';
    const city     = a.city ?? a.town ?? a.county ?? '';
    const state    = a.state ?? '';
    const address  = [locality, city].filter(Boolean).join(', ') || city || state;
    return { address, city, state };
  } catch {
    return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: '', state: '' };
  }
}

export function useLocation(): LocationInfo {
  const [info, setInfo] = useState<LocationInfo>({ ...DEFAULT, loading: true });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setInfo({ ...DEFAULT, error: 'Geolocation not supported', loading: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        setInfo({ lat, lng, ...geo, loading: false, error: '' });
      },
      (err) => {
        setInfo({ ...DEFAULT, loading: false, error: err.message });
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  }, []);

  return info;
}
