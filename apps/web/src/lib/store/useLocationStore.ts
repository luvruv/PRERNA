import { create } from 'zustand';

export interface LocationState {
  latitude: number;
  longitude: number;
  address: string;
  isGpsLocated: boolean;
  isLoading: boolean;
  error: string | null;
  setLocation: (lat: number, lng: number, address?: string) => void;
  detectCurrentLocation: () => Promise<boolean>;
  loadStoredLocation: () => void;
}

const DEFAULT_LAT = 28.4595;
const DEFAULT_LNG = 77.0266;
const DEFAULT_ADDRESS = 'DLF Cyber City, Sector 25, Gurugram';

const STORAGE_KEY = 'prerna_customer_location';

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LNG,
  address: DEFAULT_ADDRESS,
  isGpsLocated: false,
  isLoading: false,
  error: null,

  setLocation: (lat: number, lng: number, address?: string) => {
    const finalAddress = address || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    const loc = { latitude: lat, longitude: lng, address: finalAddress, isGpsLocated: false };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      } catch {}
    }
    set({
      latitude: lat,
      longitude: lng,
      address: finalAddress,
      isGpsLocated: false,
      error: null,
    });
  },

  detectCurrentLocation: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      set({ error: 'Geolocation is not supported by your browser' });
      return false;
    }

    set({ isLoading: true, error: null });

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let detectedAddress = `Current Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;

          // Try reverse geocoding via OpenStreetMap free Nominatim endpoint
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              {
                signal: controller.signal,
                headers: {
                  'Accept-Language': 'en',
                },
              },
            );
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              if (data && data.display_name) {
                // Pick a concise version (suburb, city, etc.)
                const addr = data.address || {};
                const parts = [
                  addr.suburb || addr.neighbourhood || addr.road,
                  addr.city || addr.town || addr.county || 'Gurugram',
                  addr.state || 'Haryana',
                ].filter(Boolean);
                detectedAddress = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
              }
            }
          } catch {}

          const loc = { latitude: lat, longitude: lng, address: detectedAddress, isGpsLocated: true };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          } catch {}

          set({
            latitude: lat,
            longitude: lng,
            address: detectedAddress,
            isGpsLocated: true,
            isLoading: false,
            error: null,
          });
          resolve(true);
        },
        (err) => {
          let errorMsg = 'Failed to retrieve location.';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Location access was denied. Please allow location permissions in your browser or select manually.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Location information is unavailable.';
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'Location request timed out.';
          }
          set({ error: errorMsg, isLoading: false });
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  },

  loadStoredLocation: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.latitude && parsed.longitude) {
          set({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            address: parsed.address || DEFAULT_ADDRESS,
            isGpsLocated: parsed.isGpsLocated || false,
          });
        }
      }
    } catch {}
  },
}));
