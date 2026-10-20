'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, X, Check, Search, AlertCircle, Compass } from 'lucide-react';
import { useLocationStore } from '@/lib/store/useLocationStore';

const PRESET_LOCALITIES = [
  { label: 'Galleria Market, DLF Phase 4', lat: 28.4595, lng: 77.0266, area: 'Gurugram' },
  { label: 'Cyber City / Phase 2 Metro', lat: 28.4907, lng: 77.0899, area: 'Gurugram' },
  { label: 'Sector 29 Hub / Leisure Valley', lat: 28.4682, lng: 77.0384, area: 'Gurugram' },
  { label: 'Golf Course Road, Central Plaza', lat: 28.4412, lng: 77.1025, area: 'Gurugram' },
  { label: 'Sohna Road / Subhash Chowk', lat: 28.4285, lng: 77.0423, area: 'Gurugram' },
  { label: 'Connaught Place, Inner Circle', lat: 28.6315, lng: 77.2167, area: 'New Delhi' },
];

export function LocationPickerModal() {
  const { isPickerOpen, closePicker, location, setLocation, requestCurrentGps, isLocating, error } =
    useLocationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [manualLat, setManualLat] = useState(location.latitude.toString());
  const [manualLng, setManualLng] = useState(location.longitude.toString());
  const [manualLabel, setManualLabel] = useState(location.label);

  if (!isPickerOpen) return null;

  const handleSelectPreset = (preset: (typeof PRESET_LOCALITIES)[0]) => {
    setLocation({
      latitude: preset.lat,
      longitude: preset.lng,
      label: preset.label,
      address: `${preset.label}, ${preset.area}`,
      isGps: false,
    });
  };

  const handleApplyCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates (-90 to 90, -180 to 180)');
      return;
    }
    setLocation({
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lng.toFixed(5)),
      label: manualLabel.trim() || `GPS: ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
      address: manualLabel.trim() || `Custom Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      isGps: false,
    });
  };

  const filteredPresets = PRESET_LOCALITIES.filter((p) =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.area.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#F0DEC8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#F0DEC8] flex items-center justify-between bg-[#FAF3EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D9700F] text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#6B3A0A]">Select Delivery Location</h2>
              <p className="text-[11px] text-[#8C6D53]">For instant 10-min grocery delivery from closest stores</p>
            </div>
          </div>
          <button
            onClick={closePicker}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#8C6D53] hover:text-[#6B3A0A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Current GPS Button */}
          <button
            type="button"
            onClick={() => requestCurrentGps()}
            disabled={isLocating}
            className="w-full flex items-center justify-between p-3.5 bg-orange-50 border-2 border-[#D9700F] rounded-2xl hover:bg-orange-100 text-left transition-all group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9700F] text-white flex items-center justify-center">
                <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="text-xs font-black text-[#6B3A0A] flex items-center gap-2">
                  <span>Use Current GPS Location</span>
                  {location.isGps && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#A66C3E]">
                  {isLocating ? 'Fetching satellite coordinates...' : 'Uses your browser device geolocation'}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#D9700F] group-hover:translate-x-1 transition-transform">
              Detect →
            </span>
          </button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-[#D9700F] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Delivery Hubs */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#6B3A0A] uppercase tracking-wider">
              Popular Delivery Hubs
            </div>
            <div className="space-y-1.5">
              {filteredPresets.map((preset) => {
                const isSelected =
                  Math.abs(location.latitude - preset.lat) < 0.001 &&
                  Math.abs(location.longitude - preset.lng) < 0.001;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#D9700F] bg-[#FFF2E5]'
                        : 'border-[#F0DEC8] hover:border-[#D9700F]/60 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass className={`w-4 h-4 ${isSelected ? 'text-[#D9700F]' : 'text-[#A66C3E]'}`} />
                      <div>
                        <div className="text-xs font-bold text-[#6B3A0A]">{preset.label}</div>
                        <div className="text-[10px] text-[#8C6D53]">
                          {preset.area} • ({preset.lat.toFixed(4)}, {preset.lng.toFixed(4)})
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#D9700F]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual GPS Coordinate Entry */}
          <div className="pt-2 border-t border-[#F0DEC8] space-y-3">
            <div className="text-xs font-bold text-[#6B3A0A] uppercase tracking-wider">
              Custom GPS Coordinates
            </div>
            <form onSubmit={handleApplyCoordinates} className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[#8C6D53] block mb-1">Latitude (°N)</label>
                <input
                  type="text"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="28.4595"
                  className="w-full px-3 py-2 bg-[#FAF3EB] border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#8C6D53] block mb-1">Longitude (°E)</label>
                <input
                  type="text"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="77.0266"
                  className="w-full px-3 py-2 bg-[#FAF3EB] border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-[#8C6D53] block mb-1">Location Label</label>
                <input
                  type="text"
                  value={manualLabel}
                  onChange={(e) => setManualLabel(e.target.value)}
                  placeholder="e.g. My Apartment, DLF Phase 5"
                  className="w-full px-3 py-2 bg-[#FAF3EB] border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                />
              </div>
              <div className="col-span-2 mt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#D9700F] text-white rounded-xl font-bold text-xs hover:bg-primary-hover shadow-md shadow-orange-500/20 transition-all"
                >
                  Set Delivery Pin
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF3EB] border-t border-[#F0DEC8] text-center text-[11px] text-[#8C6D53]">
          Current Selected: <b className="text-[#6B3A0A]">{location.label}</b> ({location.latitude.toFixed(4)},{' '}
          {location.longitude.toFixed(4)})
        </div>
      </div>
    </div>
  );
}
