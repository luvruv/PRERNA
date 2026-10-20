'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Boxes,
  MapPin,
  Navigation,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function ShopkeeperDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, loadProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Fetch real metrics & dashboard info
  const { data: dashboard, isLoading: isDashboardLoading, refetch, isFetching } = useQuery({
    queryKey: ['shopkeeper-dashboard'],
    queryFn: () => api.get('/shopkeeper/dashboard'),
    enabled: isAuthenticated && user?.role === 'SHOPKEEPER',
    refetchInterval: 5000, // live poll every 5s for incoming orders
  });

  // Fetch orders
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['shopkeeper-orders'],
    queryFn: () => api.get('/shopkeeper/orders'),
    enabled: isAuthenticated && user?.role === 'SHOPKEEPER',
    refetchInterval: 5000,
  });

  const handleStatusUpdate = async (orderId: string, status: string, notes?: string) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/shopkeeper/orders/${orderId}/status`, { status, notes });
      await Promise.all([refetch(), refetchOrders()]);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const [savingLocation, setSavingLocation] = useState(false);
  const [storeLat, setStoreLat] = useState<string>('');
  const [storeLng, setStoreLng] = useState<string>('');
  const [storeRadius, setStoreRadius] = useState<string>('10');
  const [storeAddress, setStoreAddress] = useState<string>('');
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Sync initial location when dashboard loads
  React.useEffect(() => {
    if (dashboard?.store) {
      setStoreLat(dashboard.store.latitude?.toString() || '28.4595');
      setStoreLng(dashboard.store.longitude?.toString() || '77.0266');
      setStoreRadius(dashboard.store.deliveryRadiusKm?.toString() || '10');
      setStoreAddress(dashboard.store.address || '');
    }
  }, [dashboard]);

  const handleLocationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(storeLat);
    const lng = parseFloat(storeLng);
    const radius = parseFloat(storeRadius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      alert('Please enter valid numerical latitude, longitude, and radius values');
      return;
    }

    setSavingLocation(true);
    setLocationSuccess(null);
    try {
      await api.patch('/shopkeeper/store/location', {
        latitude: lat,
        longitude: lng,
        deliveryRadiusKm: radius,
        address: storeAddress,
      });
      setLocationSuccess('Store GPS coordinates and delivery coverage updated successfully!');
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to update store location');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStoreLat(pos.coords.latitude.toFixed(5));
        setStoreLng(pos.coords.longitude.toFixed(5));
      },
      (err) => {
        alert('Could not fetch device GPS: ' + err.message);
      },
      { enableHighAccuracy: true },
    );
  };

  if (isAuthLoading || (isAuthenticated && isDashboardLoading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-28 bg-[#FAF3EB] rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#FAF3EB] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SHOPKEEPER') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4 shadow-card">
        <Store className="w-12 h-12 text-[#D9700F] mx-auto" />
        <h2 className="text-xl font-black text-[#6B3A0A]">Shopkeeper Portal</h2>
        <p className="text-xs text-[#8C6D53]">
          Please sign in with a verified merchant partner account (e.g. shopkeeper1@prernastore.local).
        </p>
        <Link href="/login" className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  const metrics = dashboard?.metrics || {
    todaysOrdersCount: 0,
    todaysSales: 0,
    pendingOrdersCount: 0,
    lowStockCount: 0,
    totalProducts: 0,
  };

  const storeInfo = dashboard?.store || user.store;

  const filteredOrders = orders.filter((o: any) => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Welcome Header - Matching Figma screenshot: 'Good morning, Rakesh!' */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0DEC8] shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D9700F] uppercase tracking-wider">
              {storeInfo?.name || 'Local Store'} • Partner Hub
            </span>
            {isFetching && (
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Live sync
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A] tracking-tight mt-0.5">
            Good morning, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs text-[#8C6D53] mt-1">
            Here's what is happening in your store today across live orders and stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/shopkeeper/store"
            className="px-4 py-2 bg-white border border-[#F0DEC8] hover:border-[#D9700F] text-[#6B3A0A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5 text-[#D9700F]" /> Shop Location & Radius
          </Link>
          <Link
            href="/shopkeeper/products"
            className="px-4 py-2 bg-white border border-[#F0DEC8] hover:border-[#D9700F] text-[#6B3A0A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#D9700F]" /> Manage Products
          </Link>
          <Link
            href="/shopkeeper/inventory"
            className="px-4 py-2 bg-[#D9700F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary-hover transition-all"
          >
            <Boxes className="w-3.5 h-3.5" /> Adjust Stock
          </Link>
        </div>
      </div>

      {/* Real Metrics Cards - Matching Figma screens */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6D53]">Today's Orders</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#D9700F] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
            {metrics.todaysOrdersCount}
          </div>
          <p className="text-[11px] text-[#A66C3E]">Orders placed today</p>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6D53]">Today's Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
            ₹{metrics.todaysSales}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">Gross sales today</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6D53]">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#D9700F] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#D9700F]">
            {metrics.pendingOrdersCount}
          </div>
          <p className="text-[11px] text-[#A66C3E]">Needs your immediate action</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6D53]">Low-Stock Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700">
            {metrics.lowStockCount}
          </div>
          <Link href="/shopkeeper/inventory" className="text-[11px] text-rose-600 hover:underline block font-semibold">
            Restock items →
          </Link>
        </div>
      </div>

      {/* Shop Location & Delivery Coverage Editor */}
      <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7E3CF]/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#D9700F] flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#6B3A0A]">Store GPS Location & Delivery Coverage</h2>
              <p className="text-xs text-[#8C6D53]">
                Configure shop coordinates and delivery radius so nearby customers can discover your store
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseDeviceLocation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF3EB] hover:bg-orange-50 border border-[#F0DEC8] hover:border-[#D9700F] text-[#6B3A0A] rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-[#D9700F]" /> Use Device GPS
          </button>
        </div>

        {locationSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
            {locationSuccess}
          </div>
        )}

        <form onSubmit={handleLocationSave} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-[#8C6D53] block mb-1">Store Latitude (°N)</label>
            <input
              type="text"
              value={storeLat}
              onChange={(e) => setStoreLat(e.target.value)}
              placeholder="28.4595"
              className="w-full px-3 py-2 bg-[#FAF3EB] border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8C6D53] block mb-1">Store Longitude (°E)</label>
            <input
              type="text"
              value={storeLng}
              onChange={(e) => setStoreLng(e.target.value)}
              placeholder="77.0266"
              className="w-full px-3 py-2 bg-[#FAF3EB] border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8C6D53] block mb-1">Delivery Radius (km)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="50"
              value={storeRadius}
              onChange={(e) => setStoreRadius(e.target.value)}
              placeholder="10"
              className="w-full px-3 py-2 bg-[#FAF3EB] border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#8C6D53] block mb-1">Physical Address</label>
            <input
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="Galleria Market, DLF Phase 4"
              className="w-full px-3 py-2 bg-[#FAF3EB] border border-[#F0DEC8] rounded-xl text-xs text-[#2D1B0D] focus:outline-none focus:border-[#D9700F]"
            />
          </div>

          <div className="md:col-span-4 flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#A66C3E]">
              Current status:{' '}
              <b className="text-[#6B3A0A]">
                {storeLat && storeLng ? `Active at (${storeLat}, ${storeLng}) • ${storeRadius} km radius` : 'No GPS set'}
              </b>
            </span>

            <button
              type="submit"
              disabled={savingLocation}
              className="px-6 py-2 bg-[#D9700F] text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              {savingLocation ? 'Saving...' : 'Save Location & Coverage'}
            </button>
          </div>
        </form>
      </div>

      {/* Orders Management Table & Tabbed Control */}
      <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7E3CF]/50 pb-4">
          <div>
            <h2 className="text-lg font-black text-[#6B3A0A]">Orders Management</h2>
            <p className="text-xs text-[#8C6D53]">Manage order preparation pipeline and dispatch</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['ALL', 'PENDING', 'PREPARING', 'READY_FOR_PICKUP'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#D9700F] text-white shadow-sm'
                    : 'bg-[#FAF3EB] text-[#6B3A0A] hover:bg-orange-50'
                }`}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#8C6D53]">
            No orders found under {activeTab.replace(/_/g, ' ')} tab.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord: any) => {
              const isLoadingThis = actionLoading === ord.id;
              return (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl border border-[#F0DEC8] hover:border-[#D9700F]/40 transition-all space-y-3 bg-[#FAF3EB]/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7E3CF]/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#6B3A0A]">{ord.orderNumber}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-[#D9700F] border border-amber-300">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-[#8C6D53]">
                          • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-[#8C6D53] mt-0.5">
                        Customer: <span className="font-bold text-[#6B3A0A]">{ord.customer?.name}</span> ({ord.customer?.phone || 'No phone'})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-[#6B3A0A]">₹{ord.total}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {ord.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="text-xs space-y-1">
                    {ord.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between text-[#2D1B0D]">
                        <span>
                          <span className="font-bold">{it.quantity}x</span> {it.productName}
                        </span>
                        <span className="font-semibold text-[#6B3A0A]">₹{it.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  {/* Shopkeeper Action Pipeline Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-[#F7E3CF]/50">
                    {ord.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(ord.id, 'CANCELLED', 'Store rejected order due to capacity')}
                          disabled={isLoadingThis}
                          className="px-3 py-1.5 border border-red-300 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(ord.id, 'CONFIRMED', 'Store accepted order')}
                          disabled={isLoadingThis}
                          className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
                        >
                          {isLoadingThis ? 'Updating...' : 'Accept Order'}
                        </button>
                      </>
                    )}

                    {ord.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.id, 'PREPARING', 'Merchant packing bag')}
                        disabled={isLoadingThis}
                        className="px-4 py-1.5 bg-[#D9700F] text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-sm"
                      >
                        {isLoadingThis ? 'Updating...' : 'Start Preparing'}
                      </button>
                    )}

                    {ord.status === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusUpdate(ord.id, 'READY_FOR_PICKUP', 'Ready for rider pickup')}
                        disabled={isLoadingThis}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
                      >
                        {isLoadingThis ? 'Updating...' : 'Mark Ready for Pickup'}
                      </button>
                    )}

                    {ord.status === 'READY_FOR_PICKUP' && (
                      <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-xl font-bold border border-amber-200">
                        ⏳ Ready • Waiting for Admin rider assignment
                      </span>
                    )}

                    {ord.status === 'ASSIGNED' && (
                      <span className="text-xs text-purple-700 bg-purple-50 px-3 py-1 rounded-xl font-bold border border-purple-200">
                        🚴 Rider Allocated • Awaiting store pickup
                      </span>
                    )}

                    {ord.status === 'PICKED_UP' && (
                      <span className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl font-bold border border-indigo-200">
                        📦 Picked Up by Rider
                      </span>
                    )}

                    {ord.status === 'DELIVERED' && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl font-bold border border-emerald-200">
                        ✅ Completed & Handed Over
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
