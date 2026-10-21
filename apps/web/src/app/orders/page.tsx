'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, Clock, ChevronRight, CheckCircle2, AlertCircle, KeyRound, Bike, Navigation, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/useAuthStore';

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders'),
    enabled: isAuthenticated,
  });

  const orders = ordersData?.items || [];

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#F0DEC8] text-center space-y-4">
        <h2 className="text-xl font-black text-[#6B3A0A]">Sign in to View Orders</h2>
        <Link href="/login" className="px-6 py-3 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  const statusSteps: Record<string, number> = {
    PENDING: 0, CONFIRMED: 1, ASSIGNED: 2, PICKED_UP: 3,
    OUT_FOR_DELIVERY: 4, DELIVERED: 5, CANCELLED: -1,
  };

  const statusLabel: Record<string, string> = {
    PENDING: 'Pending', CONFIRMED: 'Confirmed', ASSIGNED: 'Rider Assigned',
    PICKED_UP: 'Picked Up', OUT_FOR_DELIVERY: 'On the Way!',
    DELIVERED: 'Delivered ✓', CANCELLED: 'Cancelled',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse';
      case 'PICKED_UP':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-amber-100 text-[#D9700F] border-amber-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#6B3A0A]">
          My Orders & Tracking
        </h1>
        <p className="text-xs sm:text-sm text-[#8C6D53]">
          Track your active grocery deliveries and review past order receipts
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-3xl h-36 border border-[#F0DEC8]" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#F0DEC8] shadow-card space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-black text-lg text-[#6B3A0A]">No Orders Yet</h3>
          <p className="text-xs text-[#8C6D53] max-w-sm mx-auto">
            You haven't placed any orders yet. Discover farm-fresh essentials and place your first 10-minute order!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs shadow"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const isLive = ['OUT_FOR_DELIVERY', 'PICKED_UP', 'ASSIGNED'].includes(order.status);
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';

            return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className={`block bg-white rounded-3xl p-5 border hover:border-[#D9700F]/60 shadow-card hover:shadow-soft transition-all ${
                isLive ? 'border-purple-300 ring-1 ring-purple-200' : 'border-[#F0DEC8]'
              }`}
            >
              {/* Live In-Transit Banner */}
              {order.status === 'OUT_FOR_DELIVERY' && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                  <Bike className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span className="text-[11px] font-black text-purple-700">Rider is on the way to you!</span>
                  <span className="ml-auto w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                </div>
              )}
              {order.status === 'PICKED_UP' && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <Package className="w-3.5 h-3.5 text-[#D9700F] shrink-0" />
                  <span className="text-[11px] font-black text-[#D9700F]">Order picked up — heading to you soon!</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7E3CF]/50 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#6B3A0A]">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}
                    >
                      {statusLabel[order.status] || order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8C6D53] mt-0.5 block">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF2E5] border border-[#D9700F]/40 rounded-xl text-xs font-black text-[#D9700F]">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>PIN: {order.deliveryPin || (order.orderNumber ? order.orderNumber.replace(/\D/g, '').slice(-4) || '4829' : '4829')}</span>
                    </div>
                  )}
                  <span className="font-black text-base text-[#6B3A0A]">
                    ₹{order.total}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FAF3EB] text-[#D9700F] flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Progress mini-bar */}
              {!isCancelled && (
                <div className="mt-3 mb-1">
                  <div className="flex items-center gap-1">
                    {['Placed', 'Confirmed', 'Rider', 'Picked Up', 'On Way', 'Done'].map((lbl, i) => {
                      const currentStep = statusSteps[order.status] ?? 0;
                      const done = currentStep > i;
                      const active = currentStep === i;
                      return (
                        <React.Fragment key={lbl}>
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-black border ${
                              done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : active
                                ? 'bg-purple-700 border-purple-700 text-white'
                                : 'bg-[#FAF3EB] border-[#E0C9A8] text-[#B09070]'
                            }`}
                          >
                            {done ? '✓' : i + 1}
                          </div>
                          {i < 5 && (
                            <div
                              className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                                done ? 'bg-emerald-400' : 'bg-[#F0DEC8]'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items summary */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <div className="text-[#8C6D53] truncate max-w-md">
                  {order.items?.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}
                </div>
                <span className={`font-bold shrink-0 hover:underline flex items-center gap-1 ${
                  isLive ? 'text-purple-700' : 'text-[#D9700F]'
                }`}>
                  {isLive ? <><Bike className="w-3 h-3" /> Track Live →</> : 'View Details →'}
                </span>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
