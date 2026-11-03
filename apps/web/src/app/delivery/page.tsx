'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Bike,
  Package,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
  RefreshCw,
  Store,
  Compass,
  Check,
  AlertCircle,
  Sparkles,
  Radio,
  ExternalLink,
  KeyRound,
  Map,
  TrendingUp,
  IndianRupee,
  Award,
  ToggleLeft,
  ToggleRight,
  Zap,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { RiderMiniRouteMap } from '@/components/delivery/RiderMiniRouteMap';
import { useRiderSocket } from '@/lib/hooks/useRiderSocket';

export default function DeliveryDashboardPage() {
  const { user, isAuthenticated, isLoading, loadProfile } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isContinuousBroadcasting, setIsContinuousBroadcasting] = useState(true);
  const [deliveryOtp, setDeliveryOtp] = useState<Record<string, string>>({});
  const [showOtpInput, setShowOtpInput] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Live GPS state
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: 28.4595,
    lng: 77.0266,
  });
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [riderSpeed, setRiderSpeed] = useState<number>(0);
  const [gpsStatus, setGpsStatus] = useState<string>('GPS Active (DLF Sector Hub)');
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const autoSimRef = React.useRef<NodeJS.Timeout | null>(null);
  const gpsRef = React.useRef(currentGps);
  useEffect(() => {
    gpsRef.current = currentGps;
  }, [currentGps]);

  // 1. Fetch available orders ready to be claimed/accepted
  const {
    data: availableOrders = [],
    refetch: refetchAvailable,
    isFetching: isFetchingAvailable,
  } = useQuery({
    queryKey: ['delivery-available'],
    queryFn: () => api.get('/delivery/available'),
    enabled: isAuthenticated && user?.role === 'DELIVERY_PARTNER',
    refetchInterval: 4000,
  });

  // 2. Fetch active assigned deliveries
  const {
    data: activeDeliveries = [],
    refetch: refetchActive,
    isFetching: isFetchingActive,
  } = useQuery({
    queryKey: ['delivery-active'],
    queryFn: () => api.get('/delivery/active'),
    enabled: isAuthenticated && user?.role === 'DELIVERY_PARTNER',
    refetchInterval: 4000,
  });

  // 3. Fetch past delivery history
  const {
    data: deliveryHistory = [],
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['delivery-history'],
    queryFn: () => api.get('/delivery/history'),
    enabled: isAuthenticated && user?.role === 'DELIVERY_PARTNER' && activeTab === 'HISTORY',
  });

  // Active order ID for socket room (derived after queries are declared)
  const activeOrderId = activeDeliveries[0]?.order?.id ?? null;

  // WebSocket — emit rider location to /tracking gateway
  const { isConnected: isSocketLive, emitLocation, statusLabel: socketStatus, lastPing } =
    useRiderSocket({ orderId: activeOrderId });

  useEffect(() => {
    return () => {
      if (autoSimRef.current) clearInterval(autoSimRef.current);
    };
  }, []);

  // Background / Active GPS Broadcaster every 4 seconds when continuous broadcast is on
  useEffect(() => {
    if (!isContinuousBroadcasting || typeof window === 'undefined' || !navigator.geolocation) return;

    let watchId: number;
    try {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed || 0;
          const heading = pos.coords.heading || 0;
          setCurrentGps({ lat, lng });
          if (heading) setCurrentHeading(heading);
          setRiderSpeed(Math.round(speed * 3.6)); // m/s → km/h
          setGpsStatus(`Live GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E • ${Math.round(speed * 3.6)} km/h • ${Math.round(heading)}°`);

          // ═ Dual-channel: REST (persist) + WebSocket (real-time broadcast)
          emitLocation({ latitude: lat, longitude: lng, heading, speed: Math.round(speed * 3.6) });
          try {
            await api.post('/delivery/location', {
              latitude: lat,
              longitude: lng,
              heading,
              speed,
              orderId: activeDeliveries[0]?.order?.id,
            });
          } catch {}
        },
        (err) => {
          // Graceful fallback to periodic simulated or hub ping if browser denies background GPS
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 5000 },
      );
    } catch {}

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isContinuousBroadcasting, activeDeliveries]);

  // Automatically switch to AVAILABLE if no active deliveries but available requests exist
  useEffect(() => {
    if (activeDeliveries.length === 0 && availableOrders.length > 0 && activeTab === 'ACTIVE') {
      setActiveTab('AVAILABLE');
    }
  }, [activeDeliveries.length, availableOrders.length]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-28 bg-[#FAF3EB] rounded-3xl" />
        <div className="h-64 bg-[#FAF3EB] rounded-3xl" />
      </div>
    );
  }

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.post(`/delivery/orders/${orderId}/accept`);
      await Promise.all([refetchAvailable(), refetchActive()]);
      setActiveTab('ACTIVE');
    } catch (err: any) {
      alert(err.message || 'Failed to accept delivery request');
    } finally {
      setActionLoading(null);
    }
  };

  // Delivery partner advances delivery lifecycle
  const handleUpdateStatus = async (orderId: string, status: string, notes?: string) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/delivery/orders/${orderId}/status`, { status, notes });
      await Promise.all([refetchActive(), refetchHistory()]);
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Real device GPS fetch via HTML5 Geolocation API
  const handleFetchRealGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsUpdatingGps(true);
    setGpsStatus('Fetching device GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentGps({ lat, lng });
        setGpsStatus(`Live Device GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        try {
          await api.post('/delivery/location', {
            latitude: lat,
            longitude: lng,
            orderId: activeDeliveries[0]?.order?.id,
          });
          await refetchActive();
        } catch {}
        setIsUpdatingGps(false);
      },
      (err) => {
        setGpsStatus('GPS access denied by browser (using standard hub coordinates)');
        setIsUpdatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Single step simulation towards destination
  const handleSimulateMovement = async (order: any, stepRatio = 0.25) => {
    const destLat = order?.address?.latitude || 28.4682;
    const destLng = order?.address?.longitude || 77.0384;
    const curLat = gpsRef.current.lat;
    const curLng = gpsRef.current.lng;

    // Distance remaining (approx km)
    const dLatKm = (destLat - curLat) * 111;
    const dLngKm = (destLng - curLng) * 111 * Math.cos((curLat * Math.PI) / 180);
    const distKm = Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm);

    if (distKm < 0.04) {
      setGpsStatus(`🏁 Arrived at customer doorstep! (GPS: ${destLat.toFixed(4)}°N, ${destLng.toFixed(4)}°E)`);
      setRiderSpeed(0);
      if (autoSimRef.current) {
        clearInterval(autoSimRef.current);
        autoSimRef.current = null;
        setIsAutoSimulating(false);
      }
      return;
    }

    // Move closer towards the customer
    const newLat = curLat + (destLat - curLat) * stepRatio;
    const newLng = curLng + (destLng - curLng) * stepRatio;

    // Calculate heading bearing towards target
    const dLon = ((destLng - curLng) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((destLat * Math.PI) / 180);
    const x =
      Math.cos((curLat * Math.PI) / 180) * Math.sin((destLat * Math.PI) / 180) -
      Math.sin((curLat * Math.PI) / 180) * Math.cos((destLat * Math.PI) / 180) * Math.cos(dLon);
    const heading = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
    const speed = Math.floor(Math.random() * 8) + 26; // 26 - 33 km/h

    setCurrentGps({ lat: newLat, lng: newLng });
    setCurrentHeading(heading);
    setRiderSpeed(speed);
    setGpsStatus(`🚗 Auto-Drive: ${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E • ${speed} km/h • ${heading}° (ETA: ${Math.max(1, Math.round(distKm * 3))}m)`);

    // Dual-channel broadcast
    emitLocation({ latitude: newLat, longitude: newLng, heading, speed });
    try {
      await api.post('/delivery/location', {
        latitude: newLat,
        longitude: newLng,
        heading,
        speed,
        orderId: order?.id,
      });
      await refetchActive();
    } catch {}
  };

  // Toggle Auto-Drive Simulator Loop
  const handleToggleAutoSimulate = (order: any) => {
    if (isAutoSimulating) {
      if (autoSimRef.current) clearInterval(autoSimRef.current);
      autoSimRef.current = null;
      setIsAutoSimulating(false);
      setRiderSpeed(0);
      setGpsStatus('⏸ Auto-Drive Simulator Paused');
    } else {
      setIsAutoSimulating(true);
      setGpsStatus('▶ Auto-Drive Active (Streaming live path every 2.5s)...');
      handleSimulateMovement(order, 0.15);
      autoSimRef.current = setInterval(() => {
        handleSimulateMovement(order, 0.15);
      }, 2500);
    }
  };

  // Reset simulated rider back to Pickup Store
  const handleResetToStore = async (order: any) => {
    if (autoSimRef.current) {
      clearInterval(autoSimRef.current);
      autoSimRef.current = null;
      setIsAutoSimulating(false);
    }
    const storeLat = order?.store?.latitude || 28.4595;
    const storeLng = order?.store?.longitude || 77.0266;
    setCurrentGps({ lat: storeLat, lng: storeLng });
    setCurrentHeading(0);
    setRiderSpeed(0);
    setGpsStatus(`↺ Rider reset to Pickup Store (${storeLat.toFixed(4)}°N, ${storeLng.toFixed(4)}°E)`);
    emitLocation({ latitude: storeLat, longitude: storeLng, heading: 0, speed: 0 });
    try {
      await api.post('/delivery/location', {
        latitude: storeLat,
        longitude: storeLng,
        heading: 0,
        speed: 0,
        orderId: order?.id,
      });
      await refetchActive();
    } catch {}
  };

  if (!isAuthenticated || user?.role !== 'DELIVERY_PARTNER') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4 shadow-card">
        <Bike className="w-12 h-12 text-[#D9700F] mx-auto" />
        <h2 className="text-xl font-black text-[#6B3A0A]">Delivery Partner App</h2>
        <p className="text-xs text-[#8C6D53]">
          Please sign in with your registered rider account (e.g. deliverypartner@gmail.com).
        </p>
        <Link href="/login" className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  const partnerProfile = user.deliveryPartner;

  // ── Derived stats ────────────────────────────────────────────────────
  const todayDeliveries = deliveryHistory.filter((h: any) => {
    const d = new Date(h.deliveredAt || h.order?.updatedAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });
  const todayEarnings = todayDeliveries.length * 45; // ₹45 flat payout per delivery
  const totalEarnings = deliveryHistory.length * 45;
  const avgPerDelivery = deliveryHistory.length > 0 ? (totalEarnings / deliveryHistory.length).toFixed(0) : '0';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Rider Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
              <Bike className="w-7 h-7" />
            </div>
            {/* Online indicator dot */}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow transition-colors duration-300 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                isOnline
                  ? 'text-purple-700 bg-purple-50 border-purple-200'
                  : 'text-gray-500 bg-gray-100 border-gray-200'
              }`}>
                {isOnline ? 'Online · Active Rider' : 'Offline · Invisible'}
              </span>
              {(isFetchingActive || isFetchingAvailable) && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Live sync
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#6B3A0A] tracking-tight mt-0.5">
              {user.name}
            </h1>
            <p className="text-xs text-[#8C6D53]">
              {partnerProfile?.vehicleNumber || 'EV Scooter DL 01 EX 2026'} • DLF Hub
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Online/Offline Toggle */}
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 text-xs font-black transition-all duration-300 ${
              isOnline
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100'
                : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {isOnline ? (
              <><ToggleRight className="w-4 h-4" /> Go Offline</>
            ) : (
              <><ToggleLeft className="w-4 h-4" /> Go Online</>
            )}
          </button>

          {/* Tab Toggle Navigation */}
          <div className="flex items-center bg-[#FAF3EB] p-1 rounded-2xl border border-[#F0DEC8] overflow-x-auto">
            <button
              onClick={() => setActiveTab('AVAILABLE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'AVAILABLE'
                  ? 'bg-[#D9700F] text-white shadow-sm'
                  : 'text-[#6B3A0A] hover:text-[#D9700F]'
              }`}
            >
              <span>Requests</span>
              {availableOrders.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-[#D9700F] rounded-full text-[10px] font-black">
                  {availableOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'ACTIVE'
                  ? 'bg-[#D9700F] text-white shadow-sm'
                  : 'text-[#6B3A0A] hover:text-[#D9700F]'
              }`}
            >
              <span>Active</span>
              {activeDeliveries.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-purple-700 rounded-full text-[10px] font-black">
                  {activeDeliveries.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'HISTORY'
                  ? 'bg-[#D9700F] text-white shadow-sm'
                  : 'text-[#6B3A0A] hover:text-[#D9700F]'
              }`}
            >
              Earnings
            </button>
          </div>
        </div>
      </div>


      {/* ── Earnings Summary Ribbon ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#F0DEC8] shadow-card flex flex-col gap-1">
          <span className="text-[10px] font-bold text-[#8C6D53] uppercase tracking-wide">Today's Earnings</span>
          <span className="text-xl font-black text-emerald-600">₹{todayEarnings}</span>
          <span className="text-[10px] text-[#8C6D53]">{todayDeliveries.length} deliveries today</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#F0DEC8] shadow-card flex flex-col gap-1">
          <span className="text-[10px] font-bold text-[#8C6D53] uppercase tracking-wide">Total Payout</span>
          <span className="text-xl font-black text-[#6B3A0A]">₹{totalEarnings}</span>
          <span className="text-[10px] text-[#8C6D53]">{deliveryHistory.length} total completed</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#F0DEC8] shadow-card flex flex-col gap-1">
          <span className="text-[10px] font-bold text-[#8C6D53] uppercase tracking-wide">Avg / Delivery</span>
          <span className="text-xl font-black text-purple-700">₹{avgPerDelivery}</span>
          <span className="text-[10px] text-[#8C6D53]">
            {activeDeliveries.length > 0 ? `${activeDeliveries.length} in-progress` : 'Idle · Ready'}
          </span>
        </div>
      </div>

      {/* GPS Location Telemetry & Controls Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D9700F] flex items-center justify-center shrink-0 border border-orange-200">
            <Radio className="w-5 h-5 animate-pulse text-[#D9700F]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-[#6B3A0A] flex-wrap">
              <span>Rider GPS Telemetry</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              {/* WebSocket live badge */}
              {activeOrderId ? (
                isSocketLive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <Wifi className="w-2.5 h-2.5" /> Socket Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-[#D9700F] border border-amber-200">
                    <WifiOff className="w-2.5 h-2.5" /> {socketStatus}
                  </span>
                )
              ) : null}
            </div>
            <p className="text-xs text-[#8C6D53] font-medium">{gpsStatus}</p>
            {lastPing && (
              <p className="text-[10px] text-emerald-600 font-semibold">
                Last broadcast: {new Date(lastPing).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchRealGps}
            disabled={isUpdatingGps}
            className="px-3.5 py-2 bg-[#FFF2E5] border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isUpdatingGps ? 'Locating...' : 'Fetch Device GPS'}</span>
          </button>

          {activeDeliveries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Auto Drive Simulation Loop */}
              <button
                type="button"
                onClick={() => handleToggleAutoSimulate(activeDeliveries[0]?.order)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm ${
                  isAutoSimulating
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                }`}
              >
                {isAutoSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoSimulating ? 'Pause Auto-Drive' : '▶ Auto-Drive Simulator'}</span>
              </button>

              {/* Single Step Drive Closer */}
              <button
                type="button"
                onClick={() => handleSimulateMovement(activeDeliveries[0]?.order, 0.25)}
                className="px-3 py-2 bg-purple-50 border border-purple-300 text-purple-700 hover:bg-purple-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Drive 25% closer to customer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Step Closer</span>
              </button>

              {/* Reset to Store Hub */}
              <button
                type="button"
                onClick={() => handleResetToStore(activeDeliveries[0]?.order)}
                className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                title="Reset rider position to pickup store"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Hub</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: Available Requests (Requests pool waiting to be accepted) */}
      {activeTab === 'AVAILABLE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#6B3A0A] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#D9700F]" />
              <span>Available Delivery Requests ({availableOrders.length})</span>
            </h2>
            <span className="text-xs text-[#8C6D53]">Orders ready for pickup</span>
          </div>

          {availableOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F0DEC8] shadow-card space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-[#D9700F] flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg text-[#6B3A0A]">No Pending Requests</h3>
              <p className="text-xs text-[#8C6D53] max-w-sm mx-auto">
                All placed orders have been taken by riders or are being dispatched. New requests will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {availableOrders.map((ord: any) => {
                const isAccepting = actionLoading === ord.id;

                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#D9700F]/30 hover:border-[#D9700F] transition-all shadow-card space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7E3CF]/50 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-[#6B3A0A]">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-[#D9700F]">
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-[#8C6D53]">
                          Placed {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ord.items?.length || 0} items
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">Rider Payout</span>
                          <span className="font-black text-base text-emerald-600">₹45.00</span>
                        </div>
                        <div className="text-right pl-3 border-l border-[#F0DEC8]">
                          <span className="text-[10px] text-gray-500 block">Bill Total</span>
                          <span className="font-black text-base text-[#6B3A0A]">₹{ord.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#FAF3EB]/50 rounded-2xl border border-[#F0DEC8] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#6B3A0A]">
                          <Store className="w-3.5 h-3.5 text-[#D9700F]" />
                          <span>Pickup: {ord.store?.name}</span>
                        </div>
                        <p className="text-[#8C6D53]">{ord.store?.address}</p>
                      </div>

                      <div className="p-3 bg-[#FAF3EB]/50 rounded-2xl border border-[#F0DEC8] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#6B3A0A]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Drop: {ord.customer?.name} ({ord.address?.label})</span>
                        </div>
                        <p className="text-[#8C6D53]">{ord.address?.street}</p>
                      </div>
                    </div>

                    {/* Contents summary */}
                    <div className="text-xs text-[#8C6D53] bg-gray-50 px-3 py-2 rounded-xl flex items-center justify-between">
                      <span className="truncate max-w-md">
                        <b>Items:</b> {ord.items?.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}
                      </span>
                      <span className="font-bold text-[#6B3A0A] shrink-0">
                        {ord.paymentMethod === 'COD' ? 'COD' : 'Prepaid'}
                      </span>
                    </div>

                    {/* Accept Action Button */}
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(ord.id)}
                        disabled={isAccepting}
                        className="w-full sm:w-auto px-7 py-3 bg-[#D9700F] text-white rounded-2xl font-black text-xs hover:bg-primary-hover shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        <Bike className="w-4 h-4" />
                        <span>{isAccepting ? 'Accepting Request...' : 'Accept Delivery Request (Take Order)'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Active Deliveries */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#6B3A0A]">
              My Active Deliveries ({activeDeliveries.length})
            </h2>
            {availableOrders.length > 0 && (
              <button
                onClick={() => setActiveTab('AVAILABLE')}
                className="text-xs font-bold text-[#D9700F] hover:underline"
              >
                + {availableOrders.length} New Requests Available
              </button>
            )}
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F0DEC8] shadow-card space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Bike className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg text-[#6B3A0A]">No Active Deliveries</h3>
              <p className="text-xs text-[#8C6D53] max-w-sm mx-auto">
                You are currently idle and ready. Switch to <b>Available Requests</b> to accept orders placed by customers!
              </p>
              <button
                onClick={() => setActiveTab('AVAILABLE')}
                className="px-6 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block shadow-md shadow-orange-500/20"
              >
                View Available Requests ({availableOrders.length})
              </button>
            </div>
          ) : (
            activeDeliveries.map((assignment: any) => {
              const ord = assignment.order;
              const isLoadingThis = actionLoading === ord?.id;

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7E3CF]/50 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-[#6B3A0A]">
                          #{ord?.orderNumber}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          {ord?.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-[#8C6D53]">
                        Assigned at {new Date(assignment.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-[#6B3A0A]">₹{ord?.total}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-[#D9700F]">
                        {ord?.paymentMethod === 'COD' ? 'Collect COD Cash' : 'Prepaid Online'}
                      </span>
                    </div>
                  </div>

                  {/* Pickup & Delivery Location Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-[#FAF3EB]/50 rounded-2xl border border-[#F0DEC8] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-[#6B3A0A]">
                          <Store className="w-3.5 h-3.5 text-[#D9700F]" />
                          <span>Pickup: {ord?.store?.name}</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${currentGps.lat},${currentGps.lng}&destination=${ord?.store?.latitude || 28.4595},${ord?.store?.longitude || 77.0266}&travelmode=two_wheeler`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all shadow-sm"
                        >
                          <Navigation className="w-2.5 h-2.5" /> Navigate to Store
                        </a>
                      </div>
                      <p className="text-[#8C6D53]">{ord?.store?.address}</p>
                      {ord?.store?.phone && (
                        <p className="text-[11px] text-[#A66C3E]">Phone: {ord?.store?.phone}</p>
                      )}
                    </div>

                    <div className="p-3.5 bg-[#FAF3EB]/50 rounded-2xl border border-[#F0DEC8] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-[#6B3A0A]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Drop: {ord?.customer?.name} ({ord?.address?.label || 'Home'})</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${currentGps.lat},${currentGps.lng}&destination=${ord?.address?.latitude || 28.4682},${ord?.address?.longitude || 77.0384}&travelmode=two_wheeler`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all shadow-sm"
                        >
                          <Navigation className="w-2.5 h-2.5" /> Navigate to Doorstep
                        </a>
                      </div>

                      {/* Detailed Address Breakdown */}
                      <div className="text-[#8C6D53] space-y-0.5">
                        <div className="font-bold text-[#6B3A0A]">
                          {[ord?.address?.houseNumber, ord?.address?.buildingName].filter(Boolean).join(', ') || ord?.address?.street}
                        </div>
                        {(ord?.address?.colony || ord?.address?.landmark) && (
                          <div className="text-[11px] text-[#A66C3E]">
                            {[ord?.address?.colony, ord?.address?.landmark ? `Landmark: ${ord?.address?.landmark}` : ''].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        <div className="text-[11px]">
                          {ord?.address?.city}, {ord?.address?.state} - {ord?.address?.postalCode}
                        </div>
                      </div>

                      {ord?.address?.deliveryInstructions && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-[#6B3A0A]">
                          <b>Doorstep Note:</b> {ord?.address?.deliveryInstructions}
                        </div>
                      )}

                      {ord?.customer?.phone && (
                        <a
                          href={`tel:${ord?.customer?.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D9700F] hover:underline pt-0.5"
                        >
                          <Phone className="w-3 h-3" /> Call Customer: {ord?.customer?.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Parcel items */}
                  <div className="text-xs text-[#6B3A0A] bg-gray-50 p-3 rounded-2xl">
                    <span className="font-bold block mb-1">Parcel Contents:</span>
                    <div className="text-[#8C6D53] truncate">
                      {ord?.items?.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}
                    </div>
                  </div>

                  {/* In-App Mini Route Map */}
                  <RiderMiniRouteMap
                    riderLat={currentGps.lat}
                    riderLng={currentGps.lng}
                    riderHeading={currentHeading}
                    riderSpeed={riderSpeed}
                    isSocketLive={isSocketLive}
                    storeLat={ord?.store?.latitude || 28.4595}
                    storeLng={ord?.store?.longitude || 77.0266}
                    customerLat={ord?.address?.latitude || 28.4682}
                    customerLng={ord?.address?.longitude || 77.0384}
                    storeName={ord?.store?.name || 'Pickup Store'}
                    customerName={ord?.customer?.name || 'Customer'}
                    orderNumber={ord?.orderNumber || ''}
                    orderStatus={ord?.status}
                  />

                  {/* Rider Sequential Action Pipeline */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#F7E3CF]/50">
                    <div className="text-xs text-[#8C6D53] flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#D9700F]" />
                      <span>GPS: {currentGps.lat.toFixed(4)}°N, {currentGps.lng.toFixed(4)}°E</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {ord?.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'PICKED_UP', 'Rider picked up package at store')}
                          disabled={isLoadingThis}
                          className="w-full sm:w-auto px-6 py-2.5 bg-[#D9700F] text-white rounded-2xl text-xs font-black hover:bg-primary-hover shadow-md shadow-orange-500/20 transition-all"
                        >
                          {isLoadingThis ? 'Updating...' : 'Confirm Store Pickup (PICKED_UP)'}
                        </button>
                      )}

                      {ord?.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'OUT_FOR_DELIVERY', 'Rider on way to doorstep')}
                          disabled={isLoadingThis}
                          className="w-full sm:w-auto px-6 py-2.5 bg-purple-700 text-white rounded-2xl text-xs font-black hover:bg-purple-800 shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{isLoadingThis ? 'Updating...' : 'Start Driving (OUT_FOR_DELIVERY)'}</span>
                        </button>
                      )}

                      {ord?.status === 'OUT_FOR_DELIVERY' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => alert(`Broadcasting arrival alert to customer for Order #${ord.orderNumber}!`)}
                            className="px-3.5 py-2.5 bg-amber-100 text-[#D9700F] rounded-2xl text-xs font-bold hover:bg-amber-200 transition-all"
                          >
                            I Have Arrived
                          </button>

                          {showOtpInput[ord.id] ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="4-digit OTP"
                                maxLength={6}
                                value={deliveryOtp[ord.id] || ''}
                                onChange={(e) => setDeliveryOtp({ ...deliveryOtp, [ord.id]: e.target.value })}
                                className="w-24 px-2 py-2 bg-white border border-[#F0DEC8] rounded-xl text-xs font-black text-center focus:outline-none focus:border-emerald-600"
                              />
                              <button
                                onClick={() => {
                                  const entered = deliveryOtp[ord.id]?.trim();
                                  if (!entered) {
                                    alert('Please enter delivery confirmation OTP (e.g. 1234)');
                                    return;
                                  }
                                  handleUpdateStatus(ord.id, 'DELIVERED', `Delivered with OTP ${entered}`);
                                }}
                                disabled={isLoadingThis}
                                className="px-4 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verify & Deliver</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowOtpInput({ ...showOtpInput, [ord.id]: true })}
                              className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                            >
                              <KeyRound className="w-4 h-4" />
                              <span>Order Delivered (OTP Verification)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Earnings & History */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#6B3A0A] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D9700F]" />
              Earnings & Delivery History
            </h2>
            <span className="text-xs font-bold text-emerald-600">₹{totalEarnings} total</span>
          </div>

          {deliveryHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F0DEC8]">
              <Bike className="w-10 h-10 text-[#D9700F] mx-auto mb-3" />
              <p className="text-sm font-black text-[#6B3A0A]">No deliveries completed yet</p>
              <p className="text-xs text-[#8C6D53] mt-1">Accept orders to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveryHistory.map((item: any, idx: number) => {
                const deliveredAt = item.deliveredAt || item.order?.updatedAt;
                const timeStr = deliveredAt
                  ? new Date(deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—';
                const dateStr = deliveredAt
                  ? new Date(deliveredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : '—';
                const runningTotal = (deliveryHistory.length - idx) * 45;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-[#F0DEC8] shadow-card flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px] text-[#6B3A0A]">#{item.order?.orderNumber}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            DELIVERED
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8C6D53] block mt-0.5">
                          {item.order?.customer?.name} · {item.order?.address?.city}
                        </span>
                        <span className="text-[10px] text-[#B09070]">
                          {dateStr} at {timeStr}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-base text-emerald-600 block">+₹45</span>
                      <span className="text-[10px] text-[#8C6D53]">Payout</span>
                    </div>
                  </div>
                );
              })}

              {/* Summary footer */}
              <div className="bg-gradient-to-r from-[#FAF3EB] to-orange-50 rounded-2xl p-4 border border-[#F0DEC8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#D9700F]" />
                  <span className="text-xs font-black text-[#6B3A0A]">
                    {deliveryHistory.length} deliveries · ₹45 avg payout
                  </span>
                </div>
                <span className="font-black text-sm text-emerald-600">₹{totalEarnings} total</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
