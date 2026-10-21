'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Crosshair, Check } from 'lucide-react';

interface PinpointMapPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationSelect: (lat: number, lng: number, addressName?: string) => void;
}

export function PinpointMapPicker({
  initialLat,
  initialLng,
  onLocationSelect,
}: PinpointMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [pinLat, setPinLat] = useState(initialLat || 28.4595);
  const [pinLng, setPinLng] = useState(initialLng || 77.0266);
  const [detectedAddress, setDetectedAddress] = useState<string>('Drag pin or click map to locate');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocode lat/lng to readable Indian address using free OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address;
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.city_district || '';
        const city = addr.city || addr.town || addr.county || 'Gurugram';
        const formatted = [street, city].filter(Boolean).join(', ') || data.display_name.split(',').slice(0, 3).join(',');
        setDetectedAddress(formatted);
        onLocationSelect(lat, lng, formatted);
      } else {
        const fallback = `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setDetectedAddress(fallback);
        onLocationSelect(lat, lng, fallback);
      }
    } catch {
      const fallback = `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setDetectedAddress(fallback);
      onLocationSelect(lat, lng, fallback);
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [pinLat, pinLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      // Custom Draggable Pin Icon
      const pinIcon = L.divIcon({
        className: 'pinpoint-picker-pin',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);">
            <div style="background:#D9700F;color:white;padding:6px;border-radius:12px;border:2.5px solid white;box-shadow:0 6px 14px rgba(217,112,15,0.5);display:flex;align-items:center;justify-content:center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style="border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #D9700F;"></div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
      });

      const marker = L.marker([pinLat, pinLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const newPos = e.target.getLatLng();
        setPinLat(newPos.lat);
        setPinLng(newPos.lng);
        reverseGeocode(newPos.lat, newPos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setPinLat(e.latlng.lat);
        setPinLng(e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center on current GPS
  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPinLat(lat);
        setPinLng(lng);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
      },
      (err) => {
        alert('Could not fetch device location: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      {/* Map view canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-[#F0DEC8] shadow-inner bg-[#FAF3EB]">
        <div ref={mapContainerRef} style={{ height: '240px', width: '100%' }} />

        {/* Locate Me Button Overlay */}
        <button
          type="button"
          onClick={handleLocateMe}
          className="absolute top-3 right-3 z-[400] bg-white text-[#D9700F] hover:bg-[#D9700F] hover:text-white px-3 py-1.5 rounded-xl border border-[#F0DEC8] shadow-md text-xs font-bold transition flex items-center gap-1.5"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Locate Me</span>
        </button>

        {/* Bottom Instruction pill */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F0DEC8] text-[11px] text-[#6B3A0A] font-semibold flex items-center justify-between shadow-sm">
          <span className="truncate">
            {isGeocoding ? 'Detecting address...' : detectedAddress}
          </span>
          <span className="text-[10px] text-[#8C6D53] shrink-0 font-normal ml-2">
            ({pinLat.toFixed(4)}, {pinLng.toFixed(4)})
          </span>
        </div>
      </div>
    </div>
  );
}
