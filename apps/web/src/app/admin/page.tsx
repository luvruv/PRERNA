'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Store,
  Package,
  Bike,
  Clock,
  History,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Database,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';
import DatabaseTablesExplorer from '@/components/admin/DatabaseTablesExplorer';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, loadProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'METRICS' | 'DATABASE' | 'ORDERS' | 'USERS' | 'STORES' | 'AUDIT'>('METRICS');

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  const [selectedPartnerForOrder, setSelectedPartnerForOrder] = useState<Record<string, string>>({});
  const [assigningLoading, setAssigningLoading] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // 1. Fetch real platform metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics'),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    refetchInterval: 5000,
  });

  // 2. Fetch platform orders
  const { data: ordersData, refetch: refetchOrders, isFetching: isOrdersFetching } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.get('/admin/orders?limit=30'),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    refetchInterval: 5000,
  });

  // 3. Fetch delivery partners for dropdown
  const { data: deliveryPartners = [] } = useQuery({
    queryKey: ['admin-delivery-partners'],
    queryFn: () => api.get('/admin/delivery-partners'),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // 4. Fetch users
  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => api.get(`/admin/users?search=${encodeURIComponent(userSearch)}&limit=30`),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // 5. Fetch audit logs
  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get('/admin/audit-logs?limit=30'),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    refetchInterval: 5000,
  });

  // 6. Fetch stores
  const { data: storesList = [], refetch: refetchStores } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => api.get('/admin/stores'),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // 7. Fetch categories
  const { data: categoriesList = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/admin/categories'),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // 8. Fetch products dataset for database tables
  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/admin/products'),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  if (isLoading) {
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

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4 shadow-card">
        <ShieldCheck className="w-12 h-12 text-[#D9700F] mx-auto" />
        <h2 className="text-xl font-black text-[#6B3A0A]">Platform Admin Panel</h2>
        <p className="text-xs text-[#8C6D53]">
          Please sign in with administrator credentials (admin@prernastore.local).
        </p>
        <Link href="/login" className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  const handleAssignDelivery = async (orderId: string) => {
    const partnerId = selectedPartnerForOrder[orderId] || deliveryPartners[0]?.id;
    if (!partnerId) {
      alert('Please select a delivery partner to assign');
      return;
    }

    setAssigningLoading(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/assign-delivery`, {
        deliveryPartnerId: partnerId,
      });
      await Promise.all([refetchOrders(), refetchMetrics(), refetchAudit()]);
    } catch (err: any) {
      alert(err.message || 'Failed to assign delivery partner');
    } finally {
      setAssigningLoading(null);
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      await Promise.all([refetchUsers(), refetchAudit()]);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const handleToggleStore = async (storeId: string) => {
    try {
      await api.patch(`/admin/stores/${storeId}/toggle-status`);
      await Promise.all([refetchStores(), refetchMetrics(), refetchAudit()]);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle store status');
    }
  };

  const orders = ordersData?.items || [];
  const usersList = usersData?.items || [];
  const auditLogs = auditData?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D9700F] uppercase tracking-wider">
              Platform Master Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A] tracking-tight mt-0.5">
            System Administration
          </h1>
          <p className="text-xs text-[#8C6D53] mt-1">
            Real-time platform metrics, dispatch allocation, user access, and system audit logs
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FAF3EB] p-1 rounded-2xl border border-[#F0DEC8] overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'METRICS'
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('DATABASE')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'DATABASE'
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Tables ({allProducts.length || 208})</span>
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'ORDERS'
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            Orders & Dispatch
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'USERS'
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            Users & Roles
          </button>
          <button
            onClick={() => setActiveTab('STORES')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'STORES'
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            Stores & Catalog
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-[#D9700F] text-white shadow-sm'
                : 'text-[#6B3A0A] hover:text-[#D9700F]'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* 1. METRICS OVERVIEW TAB */}
      {activeTab === 'METRICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-1.5">
              <span className="text-xs font-bold text-[#8C6D53]">Total Platform Revenue</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                ₹{metrics?.totalRevenue ?? 0}
              </div>
              <p className="text-[11px] text-[#A66C3E]">All non-cancelled orders</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-1.5">
              <span className="text-xs font-bold text-[#8C6D53]">Total Orders Placed</span>
              <div className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
                {metrics?.totalOrders ?? 0}
              </div>
              <p className="text-[11px] text-[#A66C3E]">Cumulative order volume</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-1.5">
              <span className="text-xs font-bold text-[#8C6D53]">Pending / Ready for Dispatch</span>
              <div className="text-2xl sm:text-3xl font-black text-[#D9700F]">
                {metrics?.readyForPickupOrders ?? 0}
              </div>
              <p className="text-[11px] text-[#A66C3E]">Orders awaiting rider allocation</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card space-y-1.5">
              <span className="text-xs font-bold text-[#8C6D53]">Active Delivery Riders</span>
              <div className="text-2xl sm:text-3xl font-black text-purple-700">
                {metrics?.activeDeliveryPartners ?? 0}
              </div>
              <p className="text-[11px] text-[#A66C3E]">Riders on duty</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#D9700F] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#8C6D53]">Total Registered Users</span>
                <div className="text-xl font-black text-[#6B3A0A]">{metrics?.totalUsers ?? 0}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#D9700F] flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#8C6D53]">Active Merchant Stores</span>
                <div className="text-xl font-black text-[#6B3A0A]">{metrics?.totalStores ?? 0}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#F0DEC8] shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#8C6D53]">Active Products Listed</span>
                <div className="text-xl font-black text-[#6B3A0A]">{metrics?.totalProducts ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DATABASE TABLES & DATASETS EXPLORER */}
      {activeTab === 'DATABASE' && (
        <DatabaseTablesExplorer
          products={allProducts}
          stores={storesList}
          orders={orders}
          users={usersList}
        />
      )}

      {/* 2. ORDERS & DISPATCH TAB */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F7E3CF]/50 pb-3">
            <div>
              <h2 className="text-lg font-black text-[#6B3A0A]">Platform Orders & Dispatch</h2>
              <p className="text-xs text-[#8C6D53]">Assign delivery partners to ready orders</p>
            </div>
            {isOrdersFetching && <RefreshCw className="w-4 h-4 animate-spin text-[#D9700F]" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assign Rider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {orders.map((ord: any) => {
                  const isAssigning = assigningLoading === ord.id;
                  const canAssign =
                    ord.status === 'READY_FOR_PICKUP' ||
                    ord.status === 'CONFIRMED' ||
                    ord.status === 'PENDING';

                  return (
                    <tr key={ord.id} className="hover:bg-[#FAF3EB]/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#6B3A0A]">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-[#8C6D53]">{ord.store?.name}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2D1B0D]">{ord.customer?.name}</div>
                        <div className="text-[10px] text-[#8C6D53]">{ord.customer?.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-black text-[#6B3A0A]">₹{ord.total}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-[#D9700F]">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {ord.deliveryAssignment ? (
                          <div className="text-[11px] font-bold text-purple-700">
                            🚴 {ord.deliveryAssignment?.deliveryPartner?.user?.name || 'Assigned'}
                          </div>
                        ) : canAssign ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedPartnerForOrder[ord.id] || deliveryPartners[0]?.id || ''}
                              onChange={(e) =>
                                setSelectedPartnerForOrder({
                                  ...selectedPartnerForOrder,
                                  [ord.id]: e.target.value,
                                })
                              }
                              className="px-2 py-1 bg-white border border-[#F0DEC8] rounded-lg text-xs"
                            >
                              {deliveryPartners.map((dp: any) => (
                                <option key={dp.id} value={dp.id}>
                                  {dp.user?.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignDelivery(ord.id)}
                              disabled={isAssigning}
                              className="px-3 py-1 bg-[#D9700F] text-white rounded-lg font-bold hover:bg-primary-hover shadow-sm"
                            >
                              {isAssigning ? '...' : 'Assign'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#8C6D53] text-[11px]">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. USERS MANAGEMENT TAB */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7E3CF]/50 pb-3">
            <div>
              <h2 className="text-lg font-black text-[#6B3A0A]">Platform Users</h2>
              <p className="text-xs text-[#8C6D53]">Manage accounts and activate / deactivate access</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#A66C3E] absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user by name/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#FAF3EB]/50 border border-[#F0DEC8] rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {usersList.map((u: any) => (
                  <tr key={u.id} className="hover:bg-[#FAF3EB]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#6B3A0A]">{u.name}</div>
                      <div className="text-[10px] text-[#8C6D53]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#8C6D53]">{u.phone || '—'}</td>
                    <td className="py-3 px-4 font-bold text-[#6B3A0A]">
                      {u._count?.orders ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                          u.isActive
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. AUDIT LOGS TAB */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card p-6 space-y-4">
          <div className="border-b border-[#F7E3CF]/50 pb-3">
            <h2 className="text-lg font-black text-[#6B3A0A]">Platform Audit Trail</h2>
            <p className="text-xs text-[#8C6D53]">
              Immutable audit records for all price changes, inventory adjustments, and status transitions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E3CF]/40">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-[#FAF3EB]/30 transition-colors">
                    <td className="py-3 px-4 text-[#8C6D53] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-black text-[#D9700F]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#6B3A0A]">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2D1B0D]">{log.user?.name || 'System'}</div>
                      <div className="text-[10px] text-[#8C6D53]">{log.user?.role}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#8C6D53] max-w-xs truncate">
                      {log.newState || log.previousState || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. STORES & CATALOG TAB */}
      {activeTab === 'STORES' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card p-6 space-y-4">
            <div className="border-b border-[#F7E3CF]/50 pb-3">
              <h2 className="text-lg font-black text-[#6B3A0A]">Merchant Stores</h2>
              <p className="text-xs text-[#8C6D53]">Monitor local partner stores, products count, and active status</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF3EB] text-[#6B3A0A] uppercase text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Store Name</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Products</th>
                    <th className="py-3 px-4">Orders</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7E3CF]/40">
                  {storesList.map((st: any) => (
                    <tr key={st.id} className="hover:bg-[#FAF3EB]/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#6B3A0A]">{st.name}</div>
                        <div className="text-[10px] text-[#8C6D53]">/{st.slug}</div>
                      </td>
                      <td className="py-3 px-4 text-[#8C6D53]">
                        {st.city}, {st.state}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        ★ {st.rating}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#6B3A0A]">
                        {st._count?.products ?? 0}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#6B3A0A]">
                        {st._count?.orders ?? 0}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            st.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {st.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStore(st.id)}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] ${
                            st.isActive
                              ? 'border border-red-200 text-red-600 hover:bg-red-50'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {st.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#F0DEC8] shadow-card p-6 space-y-4">
            <div className="border-b border-[#F7E3CF]/50 pb-3">
              <h2 className="text-lg font-black text-[#6B3A0A]">Product Categories</h2>
              <p className="text-xs text-[#8C6D53]">Platform taxonomy categories available to merchants</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categoriesList.map((cat: any) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl border border-[#F0DEC8] bg-[#FAF3EB]/30 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-xs text-[#6B3A0A]">{cat.name}</h3>
                    <p className="text-[10px] text-[#8C6D53] mt-0.5">{cat.slug}</p>
                  </div>
                  <div className="mt-3 text-[11px] font-bold text-[#D9700F]">
                    {cat._count?.products ?? 0} products listed
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
