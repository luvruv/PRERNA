'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

const filters = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'] as const;
type OrderFilter = (typeof filters)[number];

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-sky-100 text-sky-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY_FOR_PICKUP: 'bg-violet-100 text-violet-800',
  ASSIGNED: 'bg-violet-100 text-violet-800',
  PICKED_UP: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

function getOrderStatus(order: any): string {
  return order.status || order.orderStatus || 'PENDING';
}

function getOrderItemName(item: any): string {
  return item.productName || item.product?.name || item.name || 'Item';
}

export default function ShopkeeperOrdersPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, loadProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('ALL');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const {
    data: orders = [],
    refetch,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['shopkeeper-orders'],
    queryFn: () => api.get('/shopkeeper/orders'),
    enabled: isAuthenticated && user?.role === 'SHOPKEEPER',
    refetchInterval: 5000,
  });

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order: any) => {
      const status = getOrderStatus(order);
      if (activeFilter !== 'ALL' && status !== activeFilter) return false;
      if (!query) return true;
      return [
        order.orderNumber,
        order.id,
        order.customer?.name,
        order.customer?.phone,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [orders, activeFilter, search]);

  const handleStatusUpdate = async (orderId: string, status: string, notes: string) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/shopkeeper/orders/${orderId}/status`, { status, notes });
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['shopkeeper-dashboard'] }),
      ]);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (isAuthLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="space-y-4 py-2">
        <div className="h-24 animate-pulse rounded-3xl bg-[#FAF3EB]" />
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-[#FAF3EB]" />)}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SHOPKEEPER') {
    return (
      <div className="mx-auto my-12 max-w-md rounded-3xl border border-[#F0DEC8] bg-white p-8 text-center">
        <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-[#D9700F]" />
        <h1 className="text-xl font-black text-[#6B3A0A]">Merchant Orders</h1>
        <p className="mt-2 text-xs text-[#8C6D53]">Sign in with a merchant account to manage store orders.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-full bg-[#D9700F] px-5 py-2.5 text-xs font-bold text-white">
          Go to Login
        </Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <h1 className="mt-2 font-black text-[#6B3A0A]">Could not load orders</h1>
        <p className="mt-1 text-xs text-[#8C6D53]">{(error as Error)?.message || 'Please try again.'}</p>
        <button onClick={() => refetch()} className="mt-4 rounded-xl bg-[#D9700F] px-4 py-2 text-xs font-bold text-white">
          Retry
        </button>
      </div>
    );
  }

  const pendingCount = orders.filter((order: any) => getOrderStatus(order) === 'PENDING').length;
  const visibleOrders = filteredOrders.slice(0, visibleCount);

  return (
    <div className="space-y-5 py-2">
      <section className="flex flex-col gap-4 rounded-3xl border border-[#F0DEC8] bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#D9700F]" />
            <h1 className="text-2xl font-black text-[#6B3A0A]">Orders</h1>
            {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#D9700F]" />}
          </div>
          <p className="mt-1 text-xs text-[#8C6D53]">
            {orders.length} total orders
            {pendingCount > 0 && <span className="ml-2 font-bold text-amber-700">{pendingCount} need attention</span>}
          </p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A66C3E]" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(20);
            }}
            placeholder="Search order or customer"
            className="w-full rounded-xl border border-[#F0DEC8] bg-[#FAF3EB]/60 py-2.5 pl-9 pr-3 text-xs text-[#2D1B0D] outline-none focus:border-[#D9700F]"
          />
        </label>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const count = filter === 'ALL'
            ? orders.length
            : orders.filter((order: any) => getOrderStatus(order) === filter).length;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setActiveFilter(filter);
                setVisibleCount(20);
              }}
              className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold transition ${
                activeFilter === filter
                  ? 'bg-[#D9700F] text-white shadow-sm'
                  : 'border border-[#F0DEC8] bg-white text-[#6B3A0A] hover:border-[#D9700F]'
              }`}
            >
              {filter.replace(/_/g, ' ')} <span className={activeFilter === filter ? 'text-white/80' : 'text-[#A66C3E]'}>{count}</span>
            </button>
          );
        })}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="rounded-3xl border border-[#F0DEC8] bg-white px-5 py-14 text-center">
          <PackageCheck className="mx-auto h-9 w-9 text-[#D9700F]" />
          <p className="mt-3 text-sm font-bold text-[#6B3A0A]">No orders found</p>
          <p className="mt-1 text-xs text-[#8C6D53]">Try another status filter or search term.</p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visibleOrders.map((order: any) => {
            const status = getOrderStatus(order);
            const isLoadingThis = actionLoading === order.id;
            const items = order.items || [];
            const createdAt = order.createdAt || order.timestamp;
            const itemSummary = items.slice(0, 2).map((item: any) => (
              `${item.quantity}× ${getOrderItemName(item)}`
            )).join(', ');
            const remainingItems = Math.max(items.length - 2, 0);

            return (
              <article key={order.id} className="rounded-2xl border border-[#F0DEC8] bg-white p-3.5 shadow-sm transition hover:border-[#D9700F]/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-[#6B3A0A]">{order.orderNumber || order.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${statusStyles[status] || 'bg-[#FAF3EB] text-[#6B3A0A]'}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-[#8C6D53]">
                      {order.customer?.name || 'Customer'}{order.customer?.phone ? ` · ${order.customer.phone}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-[#6B3A0A]">₹{Number(order.total ?? order.billing?.totalAmount ?? 0).toLocaleString('en-IN')}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[9px] text-[#8C6D53]">
                      <Clock className="h-3 w-3" />
                      {createdAt && !Number.isNaN(new Date(createdAt).getTime())
                        ? new Date(createdAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Date unavailable'}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#F7E3CF] pt-2">
                  <p className="min-w-0 truncate text-[10px] text-[#6B3A0A]">
                    {itemSummary || 'No item details'}{remainingItems > 0 ? ` +${remainingItems} more` : ''}
                  </p>
                  <span className="shrink-0 rounded bg-[#FAF3EB] px-2 py-1 text-[9px] font-bold text-[#8C6D53]">
                    {order.paymentMethod || order.payment?.method || 'Payment'}
                  </span>
                </div>

                {status === 'PENDING' && (
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id, 'CANCELLED', 'Store rejected order due to capacity')}
                      disabled={isLoadingThis}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id, 'CONFIRMED', 'Store accepted order')}
                      disabled={isLoadingThis}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3 w-3" /> {isLoadingThis ? 'Saving...' : 'Accept'}
                    </button>
                  </div>
                )}
                {status === 'CONFIRMED' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id, 'PREPARING', 'Merchant packing bag')}
                      disabled={isLoadingThis}
                      className="rounded-lg bg-[#D9700F] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#bd5e0c] disabled:opacity-50"
                    >
                      {isLoadingThis ? 'Saving...' : 'Start preparing'}
                    </button>
                  </div>
                )}
                {status === 'PREPARING' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(order.id, 'READY_FOR_PICKUP', 'Ready for rider pickup')}
                      disabled={isLoadingThis}
                      className="rounded-lg bg-[#D9700F] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#bd5e0c] disabled:opacity-50"
                    >
                      {isLoadingThis ? 'Saving...' : 'Mark ready'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {visibleCount < filteredOrders.length && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 20)}
            className="rounded-xl border border-[#F0DEC8] bg-white px-5 py-2.5 text-xs font-bold text-[#6B3A0A] hover:border-[#D9700F]"
          >
            Load 20 more ({filteredOrders.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}