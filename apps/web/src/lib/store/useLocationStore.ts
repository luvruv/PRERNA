import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerLocation {
  latitude: number;
  longitude: number;
  label: string;
  address?: string;
  isGps: boolean;
  houseNumber?: string;
  buildingName?: string;
  road?: string;
  colony?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  deliveryInstructions?: string;
}

export interface UnifiedLocationStoreState {
  // Nested CustomerLocation for LocationPickerModal, Navbar, app/page
  location: CustomerLocation;
  // Flat properties for NearbyShopsSection, AddressDeliveryModal, checkout, CustomerLocationSelector
  latitude: number;
  longitude: number;
  address: string;
  isGpsLocated: boolean;
  isLoading: boolean;
  isLocating: boolean;
  error: string | null;
  isPickerOpen: boolean;

  // Actions
  openPicker: () => void;
  closePicker: () => void;
  setLocation: {
    (loc: CustomerLocation): void;
    (lat: number, lng: number, address?: string): void;
  };
  requestCurrentGps: () => Promise<CustomerLocation | null>;
  detectCurrentLocation: () => Promise<boolean>;
  loadStoredLocation: () => void;
}

const DEFAULT_LAT = 28.4595;
const DEFAULT_LNG = 77.0266;
const DEFAULT_LABEL = 'Galleria Market, Gurugram';
const DEFAULT_ADDRESS = 'DLF Phase 4, Gurugram, Haryana';

export const useLocationStore = create<UnifiedLocationStoreState>()(
  persist(
    (set, get) => ({
      location: {
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        label: DEFAULT_LABEL,
        address: DEFAULT_ADDRESS,
        isGps: false,
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        colony: 'DLF Phase 4',
      },
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      address: DEFAULT_ADDRESS,
      isGpsLocated: false,
      isLoading: false,
      isLocating: false,
      error: null,
      isPickerOpen: false,

      openPicker: () => set({ isPickerOpen: true }),
      closePicker: () => set({ isPickerOpen: false, error: null }),

      setLocation: ((arg1: CustomerLocation | number, arg2?: number, arg3?: string) => {
        if (typeof arg1 === 'object') {
          const loc = arg1;
          const finalAddr = loc.address || loc.label || `Lat: ${loc.latitude.toFixed(4)}, Lng: ${loc.longitude.toFixed(4)}`;
          set({
            location: {
              ...loc,
              address: finalAddr,
            },
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: finalAddr,
            isGpsLocated: loc.isGps,
            error: null,
            isPickerOpen: false,
          });
        } else {
          const lat = arg1;
          const lng = arg2 ?? DEFAULT_LNG;
          const addr = arg3 || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          set({
            location: {
              latitude: lat,
              longitude: lng,
              label: addr.length > 30 ? addr.slice(0, 28) + '...' : addr,
              address: addr,
              isGps: false,
            },
            latitude: lat,
            longitude: lng,
            address: addr,
            isGpsLocated: false,
            error: null,
            isPickerOpen: false,
          });
        }
      }) as any,

      requestCurrentGps: async (): Promise<CustomerLocation | null> => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
          set({ error: 'Geolocation is not supported by your browser', isLoading: false, isLocating: false });
          return null;
        }

        set({ isLoading: true, isLocating: true, error: null });

        return new Promise<CustomerLocation | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = Number(pos.coords.latitude.toFixed(5));
              const lng = Number(pos.coords.longitude.toFixed(5));
              let friendlyAddress = `GPS: ${lat}, ${lng}`;
              let roadName = '';
              let colonyName = '';
              let cityName = 'Gurugram';
              let stateName = 'Haryana';
              let pinCode = '122002';

              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                  {
                    signal: controller.signal,
                    headers: { 'Accept-Language': 'en' },
                  },
                );
                clearTimeout(timeoutId);
                if (res.ok) {
                  const data = await res.json();
                  if (data?.address) {
                    const addr = data.address;
                    roadName = addr.road || addr.pedestrian || addr.street || '';
                    colonyName = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || '';
                    cityName = addr.city || addr.town || addr.county || 'Gurugram';
                    stateName = addr.state || 'Haryana';
                    pinCode = addr.postcode || '122002';

                    const parts = [
                      colonyName || roadName,
                      cityName,
                      stateName,
                    ].filter(Boolean);
                    friendlyAddress = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
                  }
                }
              } catch {
                // Ignore geocoding failure, fallback cleanly
              }

              const newLoc: CustomerLocation = {
                latitude: lat,
                longitude: lng,
                label: friendlyAddress.length > 30 ? friendlyAddress.slice(0, 28) + '...' : friendlyAddress,
                address: friendlyAddress,
                isGps: true,
                road: roadName,
                colony: colonyName,
                city: cityName,
                state: stateName,
                postalCode: pinCode,
              };

              set({
                location: newLoc,
                latitude: lat,
                longitude: lng,
                address: friendlyAddress,
                isGpsLocated: true,
                isLoading: false,
                isLocating: false,
                isPickerOpen: false,
                error: null,
              });
              resolve(newLoc);
            },
            (err) => {
              let msg = 'Unable to retrieve your location.';
              if (err.code === 1) msg = 'Location access denied. Please allow GPS permissions or pick manually.';
              else if (err.code === 2) msg = 'Location unavailable. Please check GPS signal.';
              else if (err.code === 3) msg = 'Location request timed out. Please try again.';

              set({ isLoading: false, isLocating: false, error: msg });
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
          );
        });
      },

      detectCurrentLocation: async (): Promise<boolean> => {
        const result = await get().requestCurrentGps();
        return Boolean(result);
      },

      loadStoredLocation: () => {
        // Zustand persist automatically hydrates state, this method is preserved for backwards compatibility
        const currentLoc = get().location;
        if (currentLoc) {
          set({
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            address: currentLoc.address || currentLoc.label || DEFAULT_ADDRESS,
            isGpsLocated: currentLoc.isGps,
          });
        }
      },
    }),
    {
      name: 'prerna-customer-location',
      partialize: (state) => ({
        location: state.location,
        latitude: state.latitude,
        longitude: state.longitude,
        address: state.address,
        isGpsLocated: state.isGpsLocated,
      }),
    },
  ),
);
