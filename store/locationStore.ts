// Location Store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DarkStore {
  id: string;
  name: string;
  city: string;
  etaMinutes: number;
}

interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string | null;
  pincode: string | null;
  city: string | null;
  nearestStore: DarkStore | null;
  isLocating: boolean;
  locationError: string | null;

  setLocation: (params: { lat: number; lng: number; address: string; pincode: string; city: string }) => void;
  setNearestStore: (store: DarkStore | null) => void;
  setLocating: (loading: boolean) => void;
  setLocationError: (error: string | null) => void;
  clearLocation: () => void;
  detectLocation: () => Promise<void>;
  hasLocation: () => boolean;
  deliveryEta: () => string;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      lat: null,
      lng: null,
      address: null,
      pincode: null,
      city: null,
      nearestStore: null,
      isLocating: false,
      locationError: null,

      setLocation: ({ lat, lng, address, pincode, city }) =>
        set({ lat, lng, address, pincode, city, locationError: null }),

      setNearestStore: (store) => set({ nearestStore: store }),
      setLocating: (isLocating) => set({ isLocating }),
      setLocationError: (locationError) => set({ locationError }),
      clearLocation: () =>
        set({ lat: null, lng: null, address: null, pincode: null, city: null, nearestStore: null }),

      detectLocation: async () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          set({ locationError: 'Geolocation not supported by your browser.' });
          return;
        }

        set({ isLocating: true, locationError: null });

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 12_000,
              maximumAge: 5 * 60 * 1000,
              enableHighAccuracy: true,
            });
          });

          const { latitude: lat, longitude: lng } = position.coords;

          // Try our API first, then fall back to Nominatim directly
          let address = '';
          let pincode = '';
          let city = '';

          try {
            const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const json = (await res.json()) as { address: string; pincode: string; city: string; storeId?: string; storeName?: string; etaMinutes?: number };
              address = json.address;
              pincode = json.pincode;
              city = json.city;
              if (json.storeId) {
                get().setNearestStore({ id: json.storeId, name: json.storeName ?? 'Farmers Factory', city: json.city, etaMinutes: json.etaMinutes ?? 24 * 60 });
              }
            } else {
              throw new Error('API failed');
            }
          } catch {
            // Fallback: Nominatim reverse geocode (no API key needed)
            try {
              const r = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                { headers: { 'Accept-Language': 'en', 'User-Agent': 'FarmersFactory/1.0' } }
              );
              const d = (await r.json()) as { display_name?: string; address?: { postcode?: string; city?: string; town?: string; suburb?: string; county?: string } };
              address = d.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              pincode = d.address?.postcode ?? '';
              city = d.address?.city ?? d.address?.town ?? d.address?.county ?? 'Chennai';
            } catch {
              address = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
              pincode = '';
              city = 'Chennai';
            }
          }

          set({ lat, lng, address, pincode, city, isLocating: false, locationError: null });
        } catch (err) {
          let message = 'Location detection failed. Please try again.';
          if (err instanceof GeolocationPositionError) {
            if (err.code === 1) message = 'Location access denied. Please enable location permissions in your browser.';
            else if (err.code === 2) message = 'Location unavailable. Please check your device.';
            else if (err.code === 3) message = 'Location request timed out. Please try again.';
          }
          set({ locationError: message, isLocating: false });
        }
      },

      hasLocation: () => get().lat !== null && get().lng !== null,

      deliveryEta: () => {
        const store = get().nearestStore;
        if (!store) return 'Within 24 hours';
        return store.etaMinutes >= 60
          ? `${Math.round(store.etaMinutes / 60)} hrs`
          : `${store.etaMinutes} mins`;
      },
    }),
    {
      name: 'ff-location',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as unknown as Storage),
      ),
      partialize: (state) => ({
        lat: state.lat,
        lng: state.lng,
        address: state.address,
        pincode: state.pincode,
        city: state.city,
        nearestStore: state.nearestStore,
      }),
    },
  ),
);
