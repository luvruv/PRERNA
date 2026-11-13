'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function ShopkeeperDashboardPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, loadProfile } = useAuthStore();
  const [salesRange, setSalesRange] = useState<'week' | 'month' | 'year'>('week');

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
  const { data: orders = [] } = useQuery({
    queryKey: ['shopkeeper-orders'],
    queryFn: () => api.get('/shopkeeper/orders'),
    enabled: isAuthenticated && user?.role === 'SHOPKEEPER',
    refetchInterval: 5000,
  });

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
    totalSales: 0,
    pendingOrdersCount: 0,
    lowStockCount: 0,
    totalProducts: 0,
  };

  const storeInfo = dashboard?.store || user.store;

  const today = new Date();
  const bucketCount = salesRange === 'week' ? 7 : salesRange === 'month' ? 30 : 12;
  const salesBuckets = Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(today);
    if (salesRange === 'year') {
      date.setDate(1);
      date.setMonth(today.getMonth() - (bucketCount - index - 1));
    } else {
      date.setDate(today.getDate() - (bucketCount - index - 1));
    }

    const key = salesRange === 'year'
      ? `${date.getFullYear()}-${date.getMonth()}`
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const label = salesRange === 'year'
      ? date.toLocaleDateString(undefined, { month: 'short' })
      : salesRange === 'month'
        ? (index % 6 === 0 || index === bucketCount - 1
          ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
          : '')
        : date.toLocaleDateString(undefined, { weekday: 'short' });

    return { key, label, date, sales: 0 };
  });

  orders.forEach((order: any) => {
    const orderDate = new Date(order.createdAt || order.timestamp);
    if (Number.isNaN(orderDate.getTime())) return;
    const key = salesRange === 'year'
      ? `${orderDate.getFullYear()}-${orderDate.getMonth()}`
      : `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}`;
    const bucket = salesBuckets.find((item) => item.key === key);
    if (bucket) bucket.sales += Number(order.total ?? order.billing?.totalAmount ?? 0);
  });

  const maxSales = Math.max(...salesBuckets.map((bucket) => bucket.sales), 1);
  const chartPoints = salesBuckets.map((bucket, index) => ({
    x: 42 + (index * 640) / Math.max(salesBuckets.length - 1, 1),
    y: 174 - (bucket.sales / maxSales) * 142,
  }));
  const chartLine = chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const chartArea = chartPoints.length
    ? `42,184 ${chartLine} 682,184`
    : '';
  const completedOrders = orders.filter((order: any) => (order.status || order.orderStatus) === 'DELIVERED').length;
  const cancelledOrders = orders.filter((order: any) => (order.status || order.orderStatus) === 'CANCELLED').length;
  const activeOrders = Math.max(orders.length - completedOrders - cancelledOrders, 0);

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
            <Store className="w-3.5 h-3.5 text-[#D9700F]" /> Store Settings
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

        {/* All-Time Sales */}
        <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C6D53]">All-Time Sales</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
            ₹{metrics.totalSales}
          </div>
          <p className="text-[11px] text-sky-700 font-semibold">Gross sales across all orders</p>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
        <section className="rounded-3xl border border-[#F0DEC8] bg-white p-5 shadow-card sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A66C3E]">Sales overview</p>
              <h2 className="mt-1 text-lg font-black text-[#6B3A0A]">Gross sales trend</h2>
              <p className="mt-1 text-xs text-[#8C6D53]">Based on orders in the selected period</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-[#FAF3EB] p-1">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setSalesRange(range)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold capitalize transition ${
                    salesRange === range ? 'bg-[#D9700F] text-white shadow-sm' : 'text-[#6B3A0A] hover:bg-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#6B3A0A]">
              ₹{salesBuckets.reduce((sum, bucket) => sum + bucket.sales, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-semibold text-[#8C6D53]">
              {salesRange === 'week' ? 'Last 7 days' : salesRange === 'month' ? 'Last 30 days' : 'Last 12 months'}
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 700 220" role="img" aria-label={`Sales trend for the last ${salesRange}`} className="h-52 w-full overflow-visible">
              {[0, 1, 2, 3].map((line) => {
                const y = 30 + line * 48;
                return <line key={line} x1="42" x2="682" y1={y} y2={y} stroke="#F0DEC8" strokeDasharray="3 5" />;
              })}
              <polygon points={chartArea} fill="#D9700F" fillOpacity="0.09" />
              <polyline points={chartLine} fill="none" stroke="#D9700F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {chartPoints.map((point, index) => (
                <circle key={salesBuckets[index].key} cx={point.x} cy={point.y} r="3.5" fill="#D9700F" stroke="white" strokeWidth="2" />
              ))}
              {salesBuckets.map((bucket, index) => bucket.label && (
                <text
                  key={bucket.key}
                  x={chartPoints[index].x}
                  y="207"
                  textAnchor="middle"
                  fill="#8C6D53"
                  fontSize="10"
                >
                  {bucket.label}
                </text>
              ))}
              {!orders.length && (
                <text x="350" y="110" textAnchor="middle" fill="#8C6D53" fontSize="12">
                  Sales data will appear when orders are placed
                </text>
              )}
            </svg>
          </div>
        </section>

        <section className="rounded-3xl border border-[#F0DEC8] bg-white p-5 shadow-card sm:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A66C3E]">Order overview</p>
            <h2 className="mt-1 text-lg font-black text-[#6B3A0A]">Fulfilment status</h2>
          </div>

          <div className="mb-5 rounded-2xl bg-[#FAF3EB] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B3A0A]">Orders handled</span>
              <span className="text-2xl font-black text-[#D9700F]">{orders.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#D9700F] transition-all"
                style={{ width: `${orders.length ? (completedOrders / orders.length) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-[#8C6D53]">
              {orders.length ? `${Math.round((completedOrders / orders.length) * 100)}% delivered` : 'No orders yet'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#6B3A0A]"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Delivered</span>
              <span className="font-black text-[#6B3A0A]">{completedOrders}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#6B3A0A]"><span className="h-2 w-2 rounded-full bg-[#D9700F]" /> In progress</span>
              <span className="font-black text-[#6B3A0A]">{activeOrders}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#6B3A0A]"><span className="h-2 w-2 rounded-full bg-rose-500" /> Cancelled</span>
              <span className="font-black text-[#6B3A0A]">{cancelledOrders}</span>
            </div>
          </div>

          <Link href="/shopkeeper/orders" className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-[#D9700F] hover:underline">
            Go to order management <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}