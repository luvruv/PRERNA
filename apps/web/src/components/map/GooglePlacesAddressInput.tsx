'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface GooglePlaceAddress {
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

interface GooglePlacesAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: GooglePlaceAddress) => void;
  className: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

let placesLibraryPromise: Promise<any> | null = null;

function loadPlacesLibrary(apiKey: string): Promise<any> {
  const google = (window as any).google;
  if (google?.maps?.places) return Promise.resolve(google.maps.places);
  if (placesLibraryPromise) return placesLibraryPromise;

  placesLibraryPromise = new Promise((resolve, reject) => {
    const scriptId = 'google-maps-places-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    const script = existingScript || document.createElement('script');
    const onLoad = () => {
      const places = (window as any).google?.maps?.places;
      if (places) resolve(places);
      else reject(new Error('Google Places library did not load.'));
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', () => reject(new Error('Google Maps failed to load.')), { once: true });

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') onLoad();
      return;
    }

    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=en&region=IN`;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
    }, { once: true });
    document.head.appendChild(script);
  });

  return placesLibraryPromise;
}

export default function GooglePlacesAddressInput({
  value,
  onChange,
  onPlaceSelected,
  className,
  placeholder,
  required,
  multiline = false,
  rows = 2,
}: GooglePlacesAddressInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    if (!apiKey) return;
    let active = true;

    loadPlacesLibrary(apiKey)
      .then((places) => {
        if (!active) return;
        autocompleteServiceRef.current = new places.AutocompleteService();
        placesServiceRef.current = new places.PlacesService(document.createElement('div'));
      })
      .catch(() => undefined);

    return () => {
      active = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [apiKey]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const input = event.target.value;
    onChange(input);
    setPredictions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!apiKey || !autocompleteServiceRef.current || input.trim().length < 3) return;

    debounceRef.current = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: input.trim(),
          types: ['address'],
          componentRestrictions: { country: 'in' },
        },
        (results: any[] | null, status: string) => {
          setPredictions(status === 'OK' ? results || [] : []);
        },
      );
    }, 250);
  };

  const selectPrediction = (prediction: any) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry'],
      },
      (place: any, status: string) => {
        if (!place || status !== 'OK') return;

        const components: any[] = place.address_components || [];
        const component = (type: string) => components.find((item) => item.types?.includes(type));
        const route = component('route')?.long_name;
        const streetNumber = component('street_number')?.long_name;
        const formattedAddress = place.formatted_address || prediction.description;
        const location = place.geometry?.location;

        onChange(formattedAddress);
        onPlaceSelected?.({
          address: formattedAddress,
          city:
            component('locality')?.long_name ||
            component('postal_town')?.long_name ||
            component('administrative_area_level_2')?.long_name,
          state: component('administrative_area_level_1')?.long_name,
          postalCode: component('postal_code')?.long_name,
          ...(location
            ? { latitude: location.lat(), longitude: location.lng() }
            : {}),
        });
        setPredictions([]);
        void streetNumber;
        void route;
      },
    );
  };

  const fieldProps = {
    value,
    onChange: handleChange,
    onBlur: () => setTimeout(() => setPredictions([]), 150),
    placeholder,
    required,
    className,
    autoComplete: 'off' as const,
  };

  return (
    <div className="relative">
      {multiline ? <textarea {...fieldProps} rows={rows} /> : <input {...fieldProps} type="text" />}
      {predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#F0DEC8] bg-white shadow-lg">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectPrediction(prediction)}
              className="block w-full border-b border-[#F7E3CF]/60 px-3 py-2.5 text-left text-xs text-[#6B3A0A] last:border-0 hover:bg-[#FAF3EB]"
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}