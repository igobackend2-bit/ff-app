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

// Route through the server-side API instead of calling Nominatim directly
// from the browser — avoids CORS issues, rate limits, and unhandled fetch rejections.
async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; city: string; state: string }> {
  try {
    const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json() as { address: string; city: string; state: string };
    return {
      address: data.address ?? '',
      city:    data.city    ?? '',
      state:   data.state   ?? '',
    };
  } catch {
    // Graceful fallback — never throw from inside a geolocation callback
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
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Wrap in a plain promise chain so errors can't leak as unhandled rejections
        reverseGeocode(lat, lng)
          .then((geo) => setInfo({ lat, lng, ...geo, loading: false, error: '' }))
          .catch(() => setInfo({ lat, lng, address: '', city: '', state: '', loading: false, error: '' }));
      },
      (err) => {
        setInfo({ ...DEFAULT, loading: false, error: err.message });
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  }, []);

  return info;
}
