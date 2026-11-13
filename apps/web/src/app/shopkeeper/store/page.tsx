'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  MapPin,
  Compass,
  Navigation,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import InteractiveLocationPicker from '@/components/map/InteractiveLocationPicker';
import GooglePlacesAddressInput from '@/components/map/GooglePlacesAddressInput';

export default function ShopkeeperStoreLocationPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    latitude: 28.4595,
    longitude: 77.0266,
    deliveryRadiusKm: 10.0,
  });

  // Fetch shopkeeper store profile
  const { data: store, isLoading: isStoreLoading, refetch } = useQuery({
    queryKey: ['shopkeeper-store-profile'],
    queryFn: () => api.get('/shopkeeper/store'),
    enabled: isAuthenticated && user?.role === 'SHOPKEEPER',
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        description: store.description || '',
        address: store.address || '',
        city: store.city || '',
        state: store.state || '',
        postalCode: store.postalCode || '',
        phone: store.phone || '',
        latitude: store.latitude ?? 28.4595,
        longitude: store.longitude ?? 77.0266,
        deliveryRadiusKm: store.deliveryRadiusKm ?? 10.0,
      });
    }
  }, [store]);

  const handleMapChange = async (coords: { lat: number; lng: number }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: Number(coords.lat.toFixed(5)),
      longitude: Number(coords.lng.toFixed(5)),
    }));
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setSuccessMessage('Pin relocated to your browser GPS coordinates!');
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      () => {
        alert('Location access denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleReverseGeocode = async () => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${formData.latitude}&lon=${formData.longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        setFormData((prev) => ({
          ...prev,
          address: data.name || addr.road || addr.suburb || prev.address,
          city: addr.city || addr.town || addr.county || prev.city || 'Gurugram',
          state: addr.state || prev.state || 'Haryana',
          postalCode: addr.postcode || prev.postalCode || '122002',
        }));
        setSuccessMessage('Address details auto-filled from map location!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch {
      alert('Could not fetch address for these coordinates. Please enter manually.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.put('/shopkeeper/store', {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        phone: formData.phone,
        latitude: formData.latitude,
        longitude: formData.longitude,
        deliveryRadiusKm: formData.deliveryRadiusKm,
      });

      setSuccessMessage('Shop location, coordinates, and delivery radius saved successfully!');
      await refetch();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update store settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || isStoreLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-24 bg-[#FAF3EB] rounded-3xl" />
        <div className="h-96 bg-[#FAF3EB] rounded-3xl" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SHOPKEEPER') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4 shadow-card">
        <Store className="w-12 h-12 text-[#D9700F] mx-auto" />
        <h2 className="text-xl font-black text-[#6B3A0A]">Shopkeeper Portal</h2>
        <p className="text-xs text-[#8C6D53]">
          Please sign in with a verified merchant partner account (e.g. merchant@gmail.com).
        </p>
        <Link href="/login" className="px-6 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card">
        <div>
          <Link
            href="/shopkeeper"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6D53] hover:text-[#D9700F] mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-[#6B3A0A] flex items-center gap-2">
            <Store className="w-6 h-6 text-[#D9700F]" />
            <span>Shop Location & Delivery Coverage</span>
          </h1>
          <p className="text-xs text-[#8C6D53]">
            Configure your physical store coordinates and service radius for nearby customer discovery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-[#D9700F] border border-amber-200 rounded-full text-xs font-bold">
            {store?.name || 'My Store'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form & Interactive Map Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map & Live Coverage Circle */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-[#F0DEC8] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#6B3A0A] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#D9700F]" />
                <span>Interactive Shop Location Map</span>
              </h2>
              <p className="text-xs text-[#8C6D53]">
                Click or drag the pin to set your exact storefront location
              </p>
            </div>

            <button
              type="button"
              onClick={handleDetectGps}
              className="px-3 py-1.5 bg-[#FAF3EB] hover:bg-orange-100 text-[#6B3A0A] border border-[#F0DEC8] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Detect physical storefront GPS"
            >
              <Navigation className="w-3.5 h-3.5 text-[#D9700F]" />
              <span>Use Current GPS</span>
            </button>
          </div>

          {/* Leaflet + OpenStreetMap component */}
          <InteractiveLocationPicker
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            radiusKm={formData.deliveryRadiusKm}
            showRadius={true}
            onChange={handleMapChange}
            height="380px"
            markerTitle={formData.name || 'Your Storefront'}
          />

          {/* Coordinates Summary & Reverse Geocode Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#FAF3EB]/50 rounded-2xl border border-[#F0DEC8] text-xs">
            <div className="flex items-center gap-2 font-bold text-[#6B3A0A]">
              <MapPin className="w-4 h-4 text-[#D9700F]" />
              <span>
                Coordinates: {formData.latitude.toFixed(5)}°N, {formData.longitude.toFixed(5)}°E
              </span>
            </div>

            <button
              type="button"
              onClick={handleReverseGeocode}
              className="text-xs font-bold text-[#D9700F] hover:underline flex items-center gap-1"
            >
              <span>Autofill Address from Pin</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Configurable Delivery Radius Slider */}
          <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-[#6B3A0A]">
              <span className="flex items-center gap-1.5">
                <span>Delivery Coverage Radius</span>
                <span className="text-[10px] text-[#8C6D53] font-normal">
  (Shown as circle on map)
</span>
              </span>
              <span className="text-base text-[#D9700F] font-black">{formData.deliveryRadiusKm} km</span>
            </div>

            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={formData.deliveryRadiusKm}
              onChange={(e) =>
                setFormData({ ...formData, deliveryRadiusKm: parseFloat(e.target.value) })
              }
              className="w-full accent-[#D9700F] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-bold text-[#8C6D53]">
              <span>1 km (Local colony)</span>
              <span>10 km (Standard)</span>
              <span>30 km (Entire City)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Address & Store Metadata Inputs */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-[#F0DEC8] shadow-card space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#F7E3CF]/60 pb-3">
              <h2 className="text-base font-black text-[#6B3A0A]">Storefront Address Details</h2>
              <p className="text-xs text-[#8C6D53]">Public address displayed to customers and delivery riders</p>
            </div>

            {/* Store Name */}
            <div>
              <label className="text-xs font-bold text-[#6B3A0A] block mb-1">Store Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D9700F]"
                placeholder="e.g. Sunrise Fresh Market"
              />
            </div>

            {/* Full Street Address */}
            <div>
              <label className="text-xs font-bold text-[#6B3A0A] block mb-1">Full Street Address</label>
              <GooglePlacesAddressInput
                required
                multiline
                rows={2}
                value={formData.address}
                onChange={(address) => setFormData((prev) => ({ ...prev, address }))}
                onPlaceSelected={(place) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: place.address,
                    city: place.city || prev.city,
                    state: place.state || prev.state,
                    postalCode: place.postalCode || prev.postalCode,
                    latitude: place.latitude ?? prev.latitude,
                    longitude: place.longitude ?? prev.longitude,
                  }))
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D9700F]"
                placeholder="Shop number, market, sector..."
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#6B3A0A] block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D9700F]"
                  placeholder="Gurugram"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6B3A0A] block mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D9700F]"
                  placeholder="122002"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#6B3A0A] block mb-1">State</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D9700F]"
                placeholder="Haryana"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="text-xs font-bold text-[#6B3A0A] block mb-1">Store Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D9700F]"
                placeholder="+91 124 4567890"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-[#6B3A0A] block mb-1">Store Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0DEC8] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#D9700F]"
                placeholder="Brief summary of items sold in your store..."
              />
            </div>
          </div>

          {/* Save Action Button */}
          <div className="pt-4 border-t border-[#F7E3CF]/50">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-[#D9700F] text-white rounded-2xl font-black text-sm hover:bg-primary-hover shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Shop Location...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Shop Location & Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}