'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  ShieldCheck,
  ArrowRight,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Sparkles,
  Building,
  Home,
  Briefcase,
  AlertCircle,
  Compass,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/store/useCartStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useLocationStore } from '@/lib/store/useLocationStore';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart, clearCart } = useCartStore();
  const { user, isAuthenticated, login } = useAuthStore();
  const {
    latitude,
    longitude,
    address: gpsAddress,
    isGpsLocated,
    location,
    detectCurrentLocation,
    loadStoredLocation,
  } = useLocationStore();

  // Address selection mode: GPS (Auto-detected) vs ALTERNATE (Saved/Manual)
  const [addressMode, setAddressMode] = useState<'GPS' | 'ALTERNATE'>('GPS');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('gps-current');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);

  // Granular doorstep details for GPS Mode
  const [gpsHouseNo, setGpsHouseNo] = useState('');
  const [gpsBuilding, setGpsBuilding] = useState('');
  const [gpsLandmark, setGpsLandmark] = useState('');
  const [gpsInstructions, setGpsInstructions] = useState('');

  // Payment & checkout state
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'TEST_PAYMENT'>('COD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingInDemo, setIsLoggingInDemo] = useState(false);

  // Alternate Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newHouseNo, setNewHouseNo] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newRoad, setNewRoad] = useState('');
  const [newColony, setNewColony] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('Gurugram');
  const [newState, setNewState] = useState('Haryana');
  const [newPostalCode, setNewPostalCode] = useState('122002');
  const [newInstructions, setNewInstructions] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Fetch saved user addresses from backend
  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/users/addresses'),
    enabled: isAuthenticated,
  });

  // On page load, fetch cart and auto-detect GPS location
  useEffect(() => {
    fetchCart();
    loadStoredLocation();

    // Auto-detect GPS if not yet confirmed
    if (!isGpsLocated) {
      setIsDetectingGps(true);
      detectCurrentLocation().finally(() => {
        setIsDetectingGps(false);
      });
    }
  }, [fetchCart, loadStoredLocation, detectCurrentLocation, isGpsLocated]);

  // Handle re-detecting GPS explicitly
  const handleRedetectGps = async () => {
    setIsDetectingGps(true);
    setGpsNotification(null);
    try {
      const ok = await detectCurrentLocation();
      if (ok) {
        setGpsNotification('GPS location accurately refreshed!');
        setAddressMode('GPS');
        setSelectedAddressId('gps-current');
      } else {
        setGpsNotification('Could not detect GPS. Please check location permissions.');
      }
    } catch {
      setGpsNotification('GPS detection timed out. Using default area.');
    } finally {
      setIsDetectingGps(false);
      setTimeout(() => setGpsNotification(null), 4000);
    }
  };

  // Switch between GPS and Alternate
  const handleSelectGpsMode = () => {
    setAddressMode('GPS');
    setSelectedAddressId('gps-current');
  };

  const handleSelectAlternateMode = () => {
    setAddressMode('ALTERNATE');
    if (addresses.length > 0 && selectedAddressId === 'gps-current') {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  };

  // 1-Click Customer Demo Sign-in
  const handleQuickDemoLogin = async () => {
    setIsLoggingInDemo(true);
    try {
      await login('customer@gmail.com', '2026@prerna');
      await fetchCart();
      await refetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setIsLoggingInDemo(false);
    }
  };

  // Autofill modal using current GPS location
  const handleAutofillFromGps = () => {
    if (location) {
      if (location.road) setNewRoad(location.road);
      else if (gpsAddress) setNewRoad(gpsAddress.split(',')[0] || '');
      if (location.colony) setNewColony(location.colony);
      if (location.city) setNewCity(location.city);
      if (location.state) setNewState(location.state);
      if (location.postalCode) setNewPostalCode(location.postalCode);
      if (location.houseNumber) setNewHouseNo(location.houseNumber);
      if (location.buildingName) setNewBuilding(location.buildingName);
      if (location.landmark) setNewLandmark(location.landmark);
    } else {
      setNewRoad(gpsAddress || 'DLF Cyber City');
      setNewColony('Sector 25');
      setNewCity('Gurugram');
      setNewState('Haryana');
      setNewPostalCode('122002');
    }
  };

  // Save new alternate address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    try {
      const fullStreetDisplay = [
        newHouseNo.trim(),
        newBuilding.trim(),
        newRoad.trim(),
        newColony.trim(),
        newLandmark.trim() ? `Near ${newLandmark.trim()}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const created = await api.post('/users/addresses', {
        label: newLabel,
        houseNumber: newHouseNo.trim() || undefined,
        buildingName: newBuilding.trim() || undefined,
        road: newRoad.trim() || undefined,
        colony: newColony.trim() || undefined,
        landmark: newLandmark.trim() || undefined,
        street: fullStreetDisplay || newRoad || 'Customer Address',
        city: newCity.trim() || 'Gurugram',
        state: newState.trim() || 'Haryana',
        postalCode: newPostalCode.trim() || '122002',
        deliveryInstructions: newInstructions.trim() || undefined,
        latitude,
        longitude,
        isDefault: true,
      });

      await refetchAddresses();
      setAddressMode('ALTERNATE');
      setSelectedAddressId(created.id);
      setShowAddressModal(false);
      setNewHouseNo('');
      setNewBuilding('');
      setNewRoad('');
      setNewColony('');
      setNewLandmark('');
      setNewInstructions('');
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (addressMode === 'ALTERNATE' && (!selectedAddressId || selectedAddressId === 'gps-current')) {
      setErrorMsg('Please select or add an alternate delivery address');
      return;
    }

    setIsPlacingOrder(true);
    setErrorMsg(null);

    try {
      const isGps = addressMode === 'GPS' || selectedAddressId === 'gps-current';
      const chosenAlternate = addresses.find((a: any) => a.id === selectedAddressId);

      const addressData = isGps
        ? {
            label: 'Current GPS Location',
            houseNumber: gpsHouseNo.trim() || undefined,
            buildingName: gpsBuilding.trim() || undefined,
            landmark: gpsLandmark.trim() || undefined,
            street: [
              gpsHouseNo.trim(),
              gpsBuilding.trim(),
              gpsLandmark.trim() ? `Near ${gpsLandmark.trim()}` : '',
              gpsAddress || 'DLF Cyber City, Sector 25',
            ]
              .filter(Boolean)
              .join(', '),
            city: location?.city || 'Gurugram',
            state: location?.state || 'Haryana',
            postalCode: location?.postalCode || '122002',
            deliveryInstructions: (gpsInstructions || specialInstructions || '').trim() || undefined,
            latitude,
            longitude,
          }
        : chosenAlternate
        ? {
            label: chosenAlternate.label || 'Alternate Address',
            houseNumber: chosenAlternate.houseNumber || undefined,
            buildingName: chosenAlternate.buildingName || undefined,
            road: chosenAlternate.road || undefined,
            colony: chosenAlternate.colony || undefined,
            landmark: chosenAlternate.landmark || undefined,
            street: chosenAlternate.street,
            city: chosenAlternate.city || 'Gurugram',
            state: chosenAlternate.state || 'Haryana',
            postalCode: chosenAlternate.postalCode || '122001',
            deliveryInstructions: (chosenAlternate.deliveryInstructions || specialInstructions || '').trim() || undefined,
            latitude: chosenAlternate.latitude || 28.4682,
            longitude: chosenAlternate.longitude || 77.0851,
          }
        : {
            label: 'Alternate Address',
            street: 'DLF Phase 4, Galleria Market',
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122002',
            latitude: 28.4682,
            longitude: 77.0851,
          };

      const order = await api.post('/orders/checkout', {
        addressId: isGps ? 'gps-current' : selectedAddressId,
        paymentMethod,
        specialInstructions: (gpsInstructions || specialInstructions || '').trim() || undefined,
        addressData,
      });

      await clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  // If not authenticated, show friendly 1-click sign in card
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-14 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center shadow-card space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center mx-auto shadow-inner">
          <Navigation className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#6B3A0A]">Sign In to Complete Checkout</h2>
          <p className="text-xs text-[#8C6D53] mt-1">
            Sign in to auto-fetch your GPS address, track live delivery riders and access order history.
          </p>
        </div>

        <button
          onClick={handleQuickDemoLogin}
          disabled={isLoggingInDemo}
          className="w-full py-3.5 bg-[#D9700F] text-white rounded-2xl font-black text-xs hover:bg-[#b85b06] shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
        >
          {isLoggingInDemo ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>1-Click Sign-In as Customer (Aarav Sharma)</span>
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F] underline"
          >
            Or Sign In with Email & Password
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart fallback
  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-14 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center shadow-card space-y-4">
        <h2 className="text-xl font-black text-[#6B3A0A]">Your Cart is Empty</h2>
        <p className="text-xs text-[#8C6D53]">
          Please add fresh groceries or daily essentials to proceed to checkout.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block shadow-md shadow-orange-500/20"
        >
          Explore Groceries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation header */}
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
          Checkout & Delivery
        </h1>
        <div className="flex items-center gap-2 text-xs font-bold text-[#D9700F] bg-[#FFF2E5] px-3.5 py-1.5 rounded-full border border-[#D9700F]/30 w-fit">
          <Clock className="w-3.5 h-3.5" />
          <span>⚡ Guaranteed 10-15 Min Delivery</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {gpsNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{gpsNotification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Address Selection & Payment */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Delivery Address Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-[#F7E3CF]/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h2 className="font-black text-base text-[#6B3A0A]">
                  Delivery Address
                </h2>
              </div>

              {/* Mode switch pills */}
              <div className="flex items-center p-1 bg-[#FAF3EB] rounded-2xl border border-[#F0DEC8]">
                <button
                  type="button"
                  onClick={handleSelectGpsMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    addressMode === 'GPS'
                      ? 'bg-[#D9700F] text-white shadow-sm'
                      : 'text-[#6B3A0A] hover:text-[#D9700F]'
                  }`}
                >
                  <Navigation className="w-3 h-3" />
                  <span>Auto GPS</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectAlternateMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    addressMode === 'ALTERNATE'
                      ? 'bg-[#D9700F] text-white shadow-sm'
                      : 'text-[#6B3A0A] hover:text-[#D9700F]'
                  }`}
                >
                  <Home className="w-3 h-3" />
                  <span>Alternate Address</span>
                </button>
              </div>
            </div>

            {/* Address Mode A: Auto GPS Live Location */}
            {addressMode === 'GPS' && (
              <div className="p-4 rounded-2xl border-2 border-[#D9700F] bg-gradient-to-br from-[#FFF8F0] to-[#FAF3EB] space-y-3 relative overflow-hidden shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#D9700F] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#6B3A0A]">
                          Current GPS Live Location
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Auto-Fetched
                        </span>
                      </div>
                      <p className="text-xs text-[#8C6D53] mt-0.5 font-medium">
                        Rider will navigate directly to your current live GPS coordinates.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRedetectGps}
                    disabled={isDetectingGps}
                    title="Refresh GPS satellite location"
                    className="px-2.5 py-1.5 bg-white border border-[#F0DEC8] hover:border-[#D9700F] text-[#6B3A0A] rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 text-[#D9700F] ${isDetectingGps ? 'animate-spin' : ''}`} />
                    <span>{isDetectingGps ? 'Locking...' : 'Refresh GPS'}</span>
                  </button>
                </div>

                {/* Detected Street & Precision Coordinates */}
                <div className="bg-white/80 p-3 rounded-xl border border-[#F0DEC8] space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#D9700F] shrink-0 mt-0.5" />
                    <span className="font-bold text-[#2D1B0D] leading-relaxed">
                      {gpsAddress || 'DLF Cyber City, Sector 25, Gurugram, Haryana - 122002'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#F0DEC8]/60 text-[11px] text-[#8C6D53]">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#D9700F]" />
                      <span>GPS Coordinates:</span>
                      <strong className="text-[#6B3A0A]">
                        {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
                      </strong>
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Locked & Selected
                    </span>
                  </div>
                </div>

                {/* Specific Doorstep Location inputs for Rider Navigation */}
                <div className="bg-white/95 p-3.5 rounded-2xl border border-[#F0DEC8] space-y-2.5 text-xs shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#F0DEC8]/60 pb-1.5">
                    <span className="text-[11px] font-black text-[#6B3A0A] flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-[#D9700F]" />
                      <span>Doorstep & Flat Details (for Delivery Partner)</span>
                    </span>
                    <span className="text-[10px] text-[#A66C3E] font-medium">Helps rider find your door</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#8C6D53] block mb-0.5">
                        House / Flat / Floor No.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 402, 4th Floor"
                        value={gpsHouseNo}
                        onChange={(e) => setGpsHouseNo(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8C6D53] block mb-0.5">
                        Building / Tower / Society Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tower B, DLF Cyber City"
                        value={gpsBuilding}
                        onChange={(e) => setGpsBuilding(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8C6D53] block mb-0.5">
                        Nearby Landmark
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Opposite Metro Pillar 42"
                        value={gpsLandmark}
                        onChange={(e) => setGpsLandmark(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#8C6D53] block mb-0.5">
                        Doorstep Instructions / Gate Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Leave at door / Call on arrival"
                        value={gpsInstructions}
                        onChange={(e) => setGpsInstructions(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#A66C3E] pt-1">
                  <span>Want to send to a different flat/house?</span>
                  <button
                    type="button"
                    onClick={handleSelectAlternateMode}
                    className="text-[#D9700F] font-bold hover:underline"
                  >
                    Switch to Alternate Address →
                  </button>
                </div>
              </div>
            )}

            {/* Address Mode B: Alternate / Saved Addresses */}
            {addressMode === 'ALTERNATE' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B3A0A]">
                    Select an Alternate Address or Add New:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="text-xs font-bold text-[#D9700F] hover:underline flex items-center gap-1 bg-[#FFF2E5] px-2.5 py-1 rounded-lg border border-[#D9700F]/30"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Alternate Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-[#F0DEC8] rounded-2xl p-4 space-y-2">
                    <Building className="w-8 h-8 text-[#A66C3E] mx-auto" />
                    <p className="text-xs text-[#8C6D53]">
                      No alternate address saved yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(true)}
                      className="px-4 py-2 bg-[#D9700F] text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      Add Alternate Address Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {addresses.map((addr: any) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-[#D9700F] bg-[#FFF2E5]/60 ring-1 ring-[#D9700F]'
                              : 'border-[#F0DEC8] hover:border-[#D9700F]/40 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery_address"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-[#D9700F] focus:ring-[#D9700F]"
                          />
                          <div className="text-xs flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#6B3A0A]">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-amber-100 text-[#D9700F] font-bold px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[#8C6D53] mt-0.5 leading-relaxed font-medium">
                              {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#D9700F] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleSelectGpsMode}
                    className="text-xs text-[#8C6D53] hover:text-[#D9700F] inline-flex items-center gap-1 font-bold"
                  >
                    <Navigation className="w-3 h-3 text-[#D9700F]" />
                    <span>Or switch back to Auto GPS Live Location</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Payment Method Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F7E3CF]/50 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="font-black text-base text-[#6B3A0A]">
                Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* COD Option */}
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                  paymentMethod === 'COD'
                    ? 'border-[#D9700F] bg-[#FFF2E5]/60 ring-1 ring-[#D9700F]'
                    : 'border-[#F0DEC8] hover:border-[#D9700F]/40'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="text-[#D9700F] focus:ring-[#D9700F]"
                />
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#D9700F] flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-black text-[#6B3A0A] block text-sm">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[#8C6D53]">
                    Pay cash directly to the rider upon delivery at your doorstep
                  </span>
                </div>
              </label>

              {/* Test Online Payment Option */}
              <label
                onClick={() => setPaymentMethod('TEST_PAYMENT')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                  paymentMethod === 'TEST_PAYMENT'
                    ? 'border-[#D9700F] bg-[#FFF2E5]/60 ring-1 ring-[#D9700F]'
                    : 'border-[#F0DEC8] hover:border-[#D9700F]/40'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'TEST_PAYMENT'}
                  onChange={() => setPaymentMethod('TEST_PAYMENT')}
                  className="text-[#D9700F] focus:ring-[#D9700F]"
                />
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-black text-[#6B3A0A] block text-sm">
                    Online Payment (Instant Simulator)
                  </span>
                  <span className="text-[#8C6D53]">
                    Simulate instant UPI / card checkout without entering card details
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Delivery Instructions Note */}
          <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card">
            <label className="block text-xs font-bold text-[#6B3A0A] mb-1.5">
              Special Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Ring doorbell twice, leave with security guard, call upon arrival..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs sm:text-sm text-[#2D1B0D] placeholder-[#A66C3E]/60 focus:outline-none focus:border-[#D9700F]"
            />
          </div>
        </div>

        {/* Right Column: Order Review & Place Order Button */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-4">
            <h3 className="font-black text-base text-[#6B3A0A] border-b border-[#F7E3CF]/50 pb-3">
              Order Summary ({cart.totalItems} items)
            </h3>

            {/* Micro items list */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="truncate max-w-[190px]">
                    <span className="font-bold text-[#6B3A0A]">{item.quantity}x</span>{' '}
                    <span className="text-[#2D1B0D]">{item.productName}</span>
                  </div>
                  <span className="font-bold text-[#6B3A0A]">₹{item.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Selected Address Preview in Summary */}
            <div className="p-3 bg-[#FAF3EB] rounded-2xl border border-[#F0DEC8] text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#8C6D53] tracking-wider block">
                Deliver to:
              </span>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D9700F] shrink-0 mt-0.5" />
                <span className="font-bold text-[#6B3A0A] text-xs line-clamp-2">
                  {addressMode === 'GPS'
                    ? gpsAddress || 'DLF Cyber City, Sector 25, Gurugram'
                    : addresses.find((a: any) => a.id === selectedAddressId)?.street ||
                      'Alternate Address'}
                </span>
              </div>
            </div>

            <div className="border-t border-[#F7E3CF] pt-3 space-y-2 text-xs text-[#6B3A0A]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold">₹{cart.subtotal}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Delivery Charge</span>
                <span className="font-bold text-[#D9700F]">₹{cart.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Taxes & Packaging (5%)</span>
                <span>₹{cart.tax}</span>
              </div>
              <div className="border-t border-[#F7E3CF] pt-3 flex justify-between text-base font-black text-[#6B3A0A]">
                <span>To Pay</span>
                <span className="text-xl text-[#D9700F]">₹{cart.total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full py-4 bg-[#D9700F] text-white rounded-2xl font-black text-sm hover:bg-[#b85b06] shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <span>
                {isPlacingOrder
                  ? 'Placing Order...'
                  : paymentMethod === 'COD'
                  ? `Place COD Order • ₹${cart.total}`
                  : `Pay Online & Order • ₹${cart.total}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Alternate Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#F0DEC8] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F7E3CF] pb-3">
              <div>
                <h3 className="font-black text-lg text-[#6B3A0A]">
                  Add Alternate Delivery Address
                </h3>
                <p className="text-xs text-[#8C6D53]">
                  Enter house/flat details or fill from GPS coordinates.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutofillFromGps}
                className="px-2.5 py-1.5 bg-[#FFF2E5] text-[#D9700F] border border-[#D9700F]/30 rounded-xl text-xs font-bold hover:bg-[#D9700F] hover:text-white transition-all flex items-center gap-1"
                title="Autofill area and pincode from current GPS"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autofill from GPS</span>
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">Address Label</label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => setNewLabel(lbl)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                        newLabel === lbl
                          ? 'bg-[#D9700F] text-white border-[#D9700F]'
                          : 'bg-white text-[#6B3A0A] border-[#F0DEC8]'
                      }`}
                    >
                      {lbl === 'Home' && <Home className="w-3.5 h-3.5" />}
                      {lbl === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                      {lbl === 'Other' && <Building className="w-3.5 h-3.5" />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">
                    House / Flat / Floor No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, 4th Floor"
                    value={newHouseNo}
                    onChange={(e) => setNewHouseNo(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">
                    Building / Tower / Society Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tower B, DLF The Crest"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">
                    Road / Street / Lane *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Golf Course Extension Road"
                    value={newRoad}
                    onChange={(e) => setNewRoad(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">
                    Colony / Sector / Area *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DLF Phase 5, Sector 54"
                    value={newColony}
                    onChange={(e) => setNewColony(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">
                  Nearby Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite One Horizon Center, Near HDFC Bank"
                  value={newLandmark}
                  onChange={(e) => setNewLandmark(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B3A0A] mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    placeholder="122002"
                    className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#6B3A0A] mb-1">
                  Doorstep Delivery Notes / Gate Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ring bell twice, leave with security guard"
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs focus:outline-none focus:border-[#D9700F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-[#F0DEC8] text-[#8C6D53] rounded-xl font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2 bg-[#D9700F] text-white rounded-xl font-bold shadow-sm hover:bg-[#b85b06] transition-all flex items-center gap-1.5"
                >
                  {isSavingAddress ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Use Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
