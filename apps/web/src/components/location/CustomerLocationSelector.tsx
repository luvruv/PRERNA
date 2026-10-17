'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  ChevronDown,
  Compass,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLocationStore } from '@/lib/store/useLocationStore';
import CustomerLocationModal from './CustomerLocationModal';

export default function CustomerLocationSelector() {
  const {
    latitude,
    longitude,
    address,
    isGpsLocated,
    isLoading,
    error,
    setLocation,
    detectCurrentLocation,
    loadStoredLocation,
  } = useLocationStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    loadStoredLocation();
  }, [loadStoredLocation]);

  const handleDetectGps = async () => {
    const ok = await detectCurrentLocation();
    if (ok) {
      setSuccessToast('Location updated via GPS!');
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleModalConfirm = ({ lat, lng, address }: { lat: number; lng: number; address?: string }) => {
    setLocation(lat, lng, address);
    setSuccessToast('Delivery location updated!');
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-[#F0DEC8] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all">
        {/* Left: Current delivery address */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF2E5] text-[#D9700F] border border-orange-200 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-[#D9700F]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#8C6D53] tracking-wider">
                Delivering to
              </span>
              {isGpsLocated && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> GPS Verified
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="group text-left font-black text-sm text-[#6B3A0A] hover:text-[#D9700F] truncate flex items-center gap-1 transition-colors mt-0.5 max-w-xs sm:max-w-md"
            >
              <span className="truncate">{address}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[#8C6D53] group-hover:text-[#D9700F] transition-transform" />
            </button>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleDetectGps}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#FAF3EB] hover:bg-orange-100 text-[#6B3A0A] border border-[#F0DEC8] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D9700F]" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-[#D9700F]" />
            )}
            <span>{isLoading ? 'Detecting...' : 'Use My Current Location'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#D9700F] text-white rounded-xl text-xs font-black hover:bg-primary-hover shadow-sm shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pick on Map</span>
          </button>
        </div>
      </div>

      {/* Success alert message */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Permission / Geolocation error alert */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-xl flex items-start gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-[#D9700F] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Location Permission</span>
            <span className="text-[11px] text-amber-700">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="underline font-bold text-xs text-[#D9700F] shrink-0"
          >
            Pick manually
          </button>
        </div>
      )}

      {/* Interactive Modal */}
      <CustomerLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        initialAddress={address}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}
