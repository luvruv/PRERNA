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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function DeliveryDashboardPage() {
  const { user, isAuthenticated, isLoading, loadProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Live GPS state
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number }>({
    lat: 28.4595,
    lng: 77.0266,
  });
  const [gpsStatus, setGpsStatus] = useState<string>('GPS Active (DLF Sector Hub)');
  const [isUpdatingGps, setIsUpdatingGps] = useState(false);

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

  // Simulation step: drive closer to customer drop location
  const handleSimulateMovement = async (order: any) => {
    const destLat = order?.address?.latitude || 28.4682;
    const destLng = order?.address?.longitude || 77.0384;
    const curLat = currentGps.lat;
    const curLng = currentGps.lng;

    // Move 30% closer towards the customer
    const newLat = curLat + (destLat - curLat) * 0.3;
    const newLng = curLng + (destLng - curLng) * 0.3;

    setCurrentGps({ lat: newLat, lng: newLng });
    setGpsStatus(`Simulated GPS: ${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E (Moving)`);

    try {
      await api.post('/delivery/location', {
        latitude: newLat,
        longitude: newLng,
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Rider Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Active Rider
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
            <span>Available Requests</span>
            {availableOrders.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-[#D9700F] rounded-full text-[10px] font-black">
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
            <span>Active Deliveries</span>
            {activeDeliveries.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-purple-700 rounded-full text-[10px] font-black">
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
            History
          </button>
        </div>
      </div>

      {/* GPS Location Telemetry & Controls Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#D9700F] flex items-center justify-center shrink-0 border border-orange-200">
            <Radio className="w-5 h-5 animate-pulse text-[#D9700F]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-[#6B3A0A]">
              <span>Rider GPS Telemetry</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            </div>
            <p className="text-xs text-[#8C6D53] font-medium">{gpsStatus}</p>
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
            <button
              type="button"
              onClick={() => handleSimulateMovement(activeDeliveries[0]?.order)}
              className="px-3.5 py-2 bg-purple-50 border border-purple-300 text-purple-700 hover:bg-purple-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Simulate Movement (Drive closer)</span>
            </button>
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
                    <div className="p-3.5 bg-[#FAF3EB]/50 rounded-2xl border border-[#F0DEC8] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#6B3A0A]">
                        <Store className="w-3.5 h-3.5 text-[#D9700F]" />
                        <span>Pickup: {ord?.store?.name}</span>
                      </div>
                      <p className="text-[#8C6D53]">{ord?.store?.address}</p>
                      {ord?.store?.phone && (
                        <p className="text-[11px] text-[#A66C3E]">Phone: {ord?.store?.phone}</p>
                      )}
                    </div>

                    <div className="p-3.5 bg-[#FAF3EB]/50 rounded-2xl border border-[#F0DEC8] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#6B3A0A]">
                        <MapPin className="w-3.5 h-3.5 text-[#D9700F]" />
                        <span>Drop: {ord?.customer?.name} ({ord?.address?.label})</span>
                      </div>
                      <p className="text-[#8C6D53]">
                        {ord?.address?.street}, {ord?.address?.city}
                      </p>
                      {ord?.customer?.phone && (
                        <a
                          href={`tel:${ord?.customer?.phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D9700F] hover:underline"
                        >
                          <Phone className="w-3 h-3" /> Call: {ord?.customer?.phone}
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

                  {/* Rider Sequential Action Pipeline */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#F7E3CF]/50">
                    <div className="text-xs text-[#8C6D53] flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#D9700F]" />
                      <span>GPS: {currentGps.lat.toFixed(4)}°N, {currentGps.lng.toFixed(4)}°E</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord?.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'PICKED_UP', 'Rider picked up package at store')}
                          disabled={isLoadingThis}
                          className="w-full sm:w-auto px-6 py-3 bg-[#D9700F] text-white rounded-2xl text-xs font-black hover:bg-primary-hover shadow-md shadow-orange-500/20 transition-all"
                        >
                          {isLoadingThis ? 'Updating...' : 'Confirm Store Pickup (PICKED_UP)'}
                        </button>
                      )}

                      {ord?.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'OUT_FOR_DELIVERY', 'Rider on way to doorstep')}
                          disabled={isLoadingThis}
                          className="w-full sm:w-auto px-6 py-3 bg-purple-700 text-white rounded-2xl text-xs font-black hover:bg-purple-800 shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{isLoadingThis ? 'Updating...' : 'Start Driving (OUT_FOR_DELIVERY)'}</span>
                        </button>
                      )}

                      {ord?.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'DELIVERED', 'Delivered at doorstep and payment completed')}
                          disabled={isLoadingThis}
                          className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isLoadingThis ? 'Updating...' : 'Mark Successfully Delivered (DELIVERED)'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Completed History */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-[#6B3A0A]">
            Completed Deliveries ({deliveryHistory.length})
          </h2>

          {deliveryHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F0DEC8]">
              <p className="text-xs text-[#8C6D53]">No past completed delivery records yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveryHistory.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-[#F0DEC8] shadow-card flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#6B3A0A]">#{item.order?.orderNumber}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        DELIVERED
                      </span>
                    </div>
                    <span className="text-[#8C6D53] text-[11px] mt-0.5 block">
                      Delivered to {item.order?.customer?.name} at {item.order?.address?.city}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-[#6B3A0A]">₹{item.order?.total}</span>
                    <span className="text-[10px] text-emerald-600 block font-bold">Payout Complete</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
