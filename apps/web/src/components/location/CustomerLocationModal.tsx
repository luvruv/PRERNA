'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import InteractiveLocationPicker from '../map/InteractiveLocationPicker';

interface CustomerLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number;
  initialLng: number;
  initialAddress: string;
  onConfirm: (coords: { lat: number; lng: number; address?: string }) => void;
}

export default function CustomerLocationModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialAddress,
  onConfirm,
}: CustomerLocationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [addressText, setAddressText] = useState(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleCoordsChange = async (coords: { lat: number; lng: number }) => {
    setSelectedCoords(coords);
    setIsGeocoding(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const parts = [
            addr.suburb || addr.neighbourhood || addr.road,
            addr.city || addr.town || addr.county || 'Gurugram',
            addr.state || 'Haryana',
          ].filter(Boolean);
          const formatted = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
          setAddressText(formatted);
        }
      }
    } catch {
      setAddressText(`Coordinates: ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        handleCoordsChange(coords);
      },
      (err) => {
        setIsGeocoding(false);
        alert('Location access denied or unavailable. Please select on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleConfirm = () => {
    onConfirm({
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      address: addressText,
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#F0DEC8] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col space-y-4 p-5 sm:p-6 animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F7E3CF]/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#D9700F] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#6B3A0A]">Choose Delivery Location</h3>
              <p className="text-xs text-[#8C6D53]">Drag pin or click map to select your doorstep</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF3EB] text-[#6B3A0A] hover:bg-orange-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location Quick Action Bar */}
        <div className="flex items-center justify-between gap-3 bg-[#FAF3EB]/50 p-3 rounded-2xl border border-[#F0DEC8]">
          <div className="flex-1 truncate">
            <span className="text-[10px] font-bold uppercase text-[#8C6D53] block">Selected Address</span>
            <div className="text-xs font-black text-[#6B3A0A] truncate flex items-center gap-1.5 mt-0.5">
              {isGeocoding && <Loader2 className="w-3 h-3 animate-spin text-[#D9700F]" />}
              <span>{addressText}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseGps}
            className="shrink-0 px-3 py-1.5 bg-white border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Use My GPS</span>
          </button>
        </div>

        {/* Leaflet Map */}
        <InteractiveLocationPicker
          initialLat={selectedCoords.lat}
          initialLng={selectedCoords.lng}
          onChange={handleCoordsChange}
          height="320px"
          markerTitle="Your Delivery Location"
        />

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F7E3CF]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#F0DEC8] text-xs font-bold text-[#8C6D53] hover:bg-[#FAF3EB]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-[#D9700F] text-white rounded-xl text-xs font-black hover:bg-primary-hover shadow-md shadow-orange-500/20 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Deliver Here</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
