'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';

interface InteractiveLocationPickerProps {
  initialLat: number;
  initialLng: number;
  radiusKm?: number;
  showRadius?: boolean;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
  zoom?: number;
  markerTitle?: string;
}

export default function InteractiveLocationPicker({
  initialLat,
  initialLng,
  radiusKm = 10,
  showRadius = false,
  onChange,
  height = '360px',
  zoom = 13,
  markerTitle = 'Selected Location',
}: InteractiveLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      // Avoid double initialization
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom DivIcon for pin to guarantee no missing asset icons
      const customPinIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -100%);
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
          ">
            <div style="
              background: #D9700F;
              color: white;
              padding: 6px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid #D9700F;
              margin-top: -1px;
            "></div>
          </div>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      marker.bindPopup(`<b>${markerTitle}</b><br>${initialLat.toFixed(4)}°, ${initialLng.toFixed(4)}°`);

      // Add radius circle if requested (for merchant store coverage)
      let circle: any = null;
      if (showRadius && radiusKm) {
        circle = L.circle([initialLat, initialLng], {
          radius: radiusKm * 1000,
          color: '#D9700F',
          weight: 2,
          fillColor: '#D9700F',
          fillOpacity: 0.15,
          dashArray: '4, 4',
        }).addTo(map);
      }

      // Handle marker drag
      marker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setCurrentCoords({ lat, lng });
        onChange({ lat, lng });
        if (circle) {
          circle.setLatLng([lat, lng]);
        }
      });

      // Handle map click to reposition marker
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ lat, lng });
        onChange({ lat, lng });
        if (circle) {
          circle.setLatLng([lat, lng]);
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
      setMapLoaded(true);

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync external coordinate changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerRef.current) return;
    if (
      Math.abs(initialLat - currentCoords.lat) > 0.0001 ||
      Math.abs(initialLng - currentCoords.lng) > 0.0001
    ) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      mapInstanceRef.current.panTo([initialLat, initialLng]);
      setCurrentCoords({ lat: initialLat, lng: initialLng });
      if (circleRef.current) {
        circleRef.current.setLatLng([initialLat, initialLng]);
      }
    }
  }, [initialLat, initialLng, mapLoaded]);

  // Sync radius changes
  useEffect(() => {
    if (!circleRef.current || !showRadius) return;
    circleRef.current.setRadius((radiusKm || 10) * 1000);
  }, [radiusKm, showRadius]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([currentCoords.lat, currentCoords.lng], 14);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#F0DEC8] shadow-card bg-[#FAF3EB] isolate z-0">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Floating Info Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#F0DEC8] shadow-sm flex items-center gap-2 text-xs font-bold text-[#6B3A0A] pointer-events-auto">
        <MapPin className="w-4 h-4 text-[#D9700F]" />
        <span>
          {currentCoords.lat.toFixed(4)}°N, {currentCoords.lng.toFixed(4)}°E
        </span>
        {showRadius && (
          <span className="text-[11px] text-[#A66C3E] border-l border-[#F0DEC8] pl-2 font-semibold">
            Radius: <b className="text-[#D9700F]">{radiusKm} km</b>
          </span>
        )}
      </div>

      {/* Floating Recenter Button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-3 right-3 z-10 bg-white hover:bg-[#FAF3EB] text-[#6B3A0A] p-2 rounded-xl border border-[#F0DEC8] shadow-md transition-all active:scale-95 pointer-events-auto"
        title="Recenter Map"
      >
        <Navigation className="w-4 h-4 text-[#D9700F]" />
      </button>

      {/* Helper text prompt at bottom */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#F0DEC8] text-[10px] text-[#8C6D53] hidden sm:block pointer-events-auto">
        💡 Click anywhere on the map or drag the pin to set location
      </div>
    </div>
  );
}
