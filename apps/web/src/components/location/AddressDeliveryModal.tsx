'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Navigation,
  Check,
  Home,
  Briefcase,
  Building,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useLocationStore } from '@/lib/store/useLocationStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { api } from '@/lib/api';
import InteractiveLocationPicker from '../map/InteractiveLocationPicker';

interface AddressDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddressDeliveryModal({ isOpen, onClose }: AddressDeliveryModalProps) {
  const [mounted, setMounted] = useState(false);
  const { latitude, longitude, address, isGpsLocated, setLocation, detectCurrentLocation } =
    useLocationStore();
  const { isAuthenticated } = useAuthStore();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude,
    lng: longitude,
  });

  const [houseNo, setHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Gurugram');
  const [postalCode, setPostalCode] = useState('122002');
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync coords when modal opens
  useEffect(() => {
    if (isOpen) {
      setCoords({ lat: latitude, lng: longitude });
      setStreetArea(address);
    }
  }, [isOpen, latitude, longitude, address]);

  if (!isOpen || !mounted) return null;

  // Trigger GPS detection
  const handleTriggerGps = async () => {
    setIsDetectingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        };
        setCoords(newCoords);
        setIsDetectingGps(false);

        // Reverse geocode
        await reverseGeocode(newCoords.lat, newCoords.lng);
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow location access or choose on map.');
        } else {
          setGpsError('Could not detect GPS location. Please pinpoint on map.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const roadPart = addr.road || addr.suburb || addr.neighbourhood || '';
        const cityPart = addr.city || addr.town || addr.county || 'Gurugram';
        const zipPart = addr.postcode || '122002';

        setStreetArea(roadPart ? `${roadPart}, ${cityPart}` : data.display_name.split(',').slice(0, 3).join(','));
        setCity(cityPart);
        setPostalCode(zipPart);
      }
    } catch {
      // fallback
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleMapPinChange = (newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleSaveAndDeliver = async () => {
    setIsSaving(true);

    const fullStreet = [
      houseNo.trim(),
      streetArea.trim(),
      landmark ? `Near ${landmark.trim()}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const completeDisplayAddress = `${fullStreet || streetArea}, ${city} - ${postalCode}`;

    // Update global location store
    setLocation(coords.lat, coords.lng, completeDisplayAddress);

    // If user is authenticated, also save to backend user addresses
    if (isAuthenticated) {
      try {
        await api.post('/users/addresses', {
          label: addressLabel,
          street: fullStreet || streetArea,
          city,
          state: 'Haryana',
          postalCode,
          latitude: coords.lat,
          longitude: coords.lng,
          isDefault: true,
        });
      } catch (err) {
        // Continue even if backend call fails
      }
    }

    setIsSaving(false);
    onClose();
  };

  const handleSkip = () => {
    // If street area is detected via GPS/map, keep it, otherwise keep current store location
    if (streetArea && streetArea !== address) {
      setLocation(coords.lat, coords.lng, streetArea);
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in flex items-center justify-center p-3 sm:p-4"
      onClick={handleSkip}
    >
      <div
        className="bg-white rounded-3xl border border-[#F0DEC8] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className="flex items-center justify-between p-5 border-b border-[#F7E3CF]/70 bg-gradient-to-r from-[#FAF3EB] to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9700F] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#6B3A0A] leading-tight">
                Enter Delivery Address
              </h2>
              <p className="text-xs text-[#8C6D53]">
                Superfast delivery in 10-15 minutes to your exact doorstep
              </p>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="w-8 h-8 rounded-full bg-white hover:bg-orange-50 text-[#6B3A0A] border border-[#F0DEC8] flex items-center justify-center transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* GPS Auto-Detect Button Card */}
          <div className="bg-[#FAF3EB]/70 p-3.5 rounded-2xl border border-[#F0DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#D9700F] flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-black uppercase text-[#D9700F] tracking-wider block">
                  Quick Location
                </span>
                <span className="text-xs font-bold text-[#6B3A0A] truncate block max-w-xs">
                  {isReverseGeocoding ? 'Locating address...' : streetArea || 'Gurugram, Haryana'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerGps}
              disabled={isDetectingGps}
              className="px-4 py-2 bg-[#D9700F] hover:bg-primary-hover text-white rounded-xl text-xs font-black shadow-sm shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-70 shrink-0"
            >
              {isDetectingGps ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Tracking GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>
          </div>

          {/* GPS Error alert if any */}
          {gpsError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Mini Interactive Map Pinpoint */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#6B3A0A]">
              <span>Pinpoint Doorstep on Map</span>
              <span className="text-[10px] text-[#8C6D53]">Drag or click to adjust</span>
            </div>
            <InteractiveLocationPicker
              initialLat={coords.lat}
              initialLng={coords.lng}
              onChange={handleMapPinChange}
              height="180px"
              zoom={15}
              markerTitle="Delivery Doorstep"
            />
          </div>

          {/* Full Address Input Fields */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#8C6D53]">
              Address Details
            </h3>

            {/* House / Flat / Floor */}
            <div>
              <label className="text-[11px] font-bold text-[#6B3A0A] block mb-1">
                House / Flat / Floor / Building <span className="text-[#D9700F]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 402, Sunshine Heights, Tower B"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#2D1B0D] focus:outline-none focus:border-[#D9700F] focus:ring-1 focus:ring-[#D9700F]/20"
              />
            </div>

            {/* Road / Society / Sector */}
            <div>
              <label className="text-[11px] font-bold text-[#6B3A0A] block mb-1">
                Area / Sector / Locality <span className="text-[#D9700F]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sector 14, DLF Galleria Road"
                value={streetArea}
                onChange={(e) => setStreetArea(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#2D1B0D] focus:outline-none focus:border-[#D9700F] focus:ring-1 focus:ring-[#D9700F]/20"
              />
            </div>

            {/* Landmark, City, Postal Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#6B3A0A] block mb-1">
                  Nearby Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opp. Park"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B3A0A] block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B3A0A] block mb-1">Pincode</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                />
              </div>
            </div>

            {/* Save As Tag */}
            <div>
              <label className="text-[11px] font-bold text-[#6B3A0A] block mb-1.5">
                Save Address As
              </label>
              <div className="flex items-center gap-2">
                {[
                  { tag: 'Home', icon: Home },
                  { tag: 'Work', icon: Briefcase },
                  { tag: 'Other', icon: Building },
                ].map(({ tag, icon: Icon }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAddressLabel(tag as any)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      addressLabel === tag
                        ? 'bg-[#D9700F] text-white border-[#D9700F] shadow-sm'
                        : 'bg-white text-[#6B3A0A] border-[#F0DEC8] hover:bg-[#FAF3EB]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer: Skip for Now & Save */}
        <div className="p-4 sm:p-5 border-t border-[#F7E3CF]/60 bg-[#FAF3EB]/30 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSkip}
            className="px-5 py-2.5 rounded-xl border border-[#F0DEC8] bg-white text-xs font-bold text-[#8C6D53] hover:text-[#6B3A0A] hover:bg-orange-50 transition-all"
          >
            Skip for Now
          </button>

          <button
            type="button"
            onClick={handleSaveAndDeliver}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#D9700F] text-white rounded-xl text-xs font-black hover:bg-primary-hover shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Deliver Here</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
