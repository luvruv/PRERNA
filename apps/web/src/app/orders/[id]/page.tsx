'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Bike,
  Store,
  MapPin,
  XCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OrderGpsTrackingMap } from '@/components/orders/OrderGpsTrackingMap';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Received by system' },
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Accepted by merchant' },
  { key: 'PREPARING', label: 'Preparing', desc: 'Packing in carry bag' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Awaiting rider pickup' },
  { key: 'ASSIGNED', label: 'Rider Assigned', desc: 'Delivery partner allocated' },
  { key: 'PICKED_UP', label: 'Picked Up', desc: 'Rider collected package' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider en route to your door' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Handed over at doorstep' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`),
    refetchInterval: 4000, // Auto-poll every 4s for live order tracking updates
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-24 bg-cream-200 rounded-3xl" />
        <div className="h-64 bg-cream-200 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-3xl border border-[#F0DEC8]">
        <h2 className="text-xl font-bold text-[#6B3A0A] mb-2">Order Not Found</h2>
        <Link href="/orders" className="px-5 py-2.5 bg-[#D9700F] text-white rounded-full font-bold text-xs inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatusIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.patch(`/orders/${order.id}/cancel`);
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const delivery = order.deliveryAssignment;
  const rider = delivery?.deliveryPartner;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top back navigation and live poll indicator */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B3A0A] hover:text-[#D9700F]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>

        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="text-[11px] text-[#A66C3E] flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-[#D9700F]" /> Live sync
            </span>
          )}
          <button
            onClick={() => refetch()}
            className="p-1.5 bg-white border border-[#F0DEC8] rounded-full text-[#6B3A0A] hover:border-[#D9700F] text-xs"
            title="Refresh order status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#6B3A0A]">
              Order #{order.orderNumber}
            </h1>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                isCancelled
                  ? 'bg-red-100 text-red-700'
                  : order.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-[#D9700F]'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-[#8C6D53] mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()} • {order.items?.length || 0} items
          </p>
        </div>

        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Live GPS Route Tracking Map */}
      {!isCancelled && (
        <OrderGpsTrackingMap
          orderId={order.id}
          orderStatus={order.status}
          storeName={order.store?.name}
          storeAddress={order.store?.address}
          customerAddress={order.address?.street}
          customerLabel={order.address?.label}
          riderName={rider?.user?.name}
          riderVehicle={rider?.vehicleType ? `${rider.vehicleType} (${rider.vehicleNumber || ''})` : undefined}
          riderLat={delivery?.currentLat || rider?.currentLat}
          riderLng={delivery?.currentLng || rider?.currentLng}
          storeLat={order.store?.latitude}
          storeLng={order.store?.longitude}
          customerLat={order.address?.latitude}
          customerLng={order.address?.longitude}
        />
      )}

      {/* Stepper Timeline matching Figma screens */}
      {!isCancelled ? (
        <div className="bg-white rounded-3xl p-6 border border-[#F0DEC8] shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#6B3A0A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D9700F]" />
              <span>Live Delivery Timeline</span>
            </h2>
            <span className="text-xs font-bold text-[#D9700F] bg-[#FFF2E5] px-3 py-1 rounded-full border border-[#D9700F]/30">
              ⚡ ETA: 10-15 Minutes
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#F0DEC8]">
            {ORDER_STEPS.map((step, idx) => {
              const isPast = currentStatusIndex >= idx;
              const isCurrent = currentStatusIndex === idx;

              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black z-10 transition-all ${
                      isCurrent
                        ? 'bg-[#D9700F] text-white ring-4 ring-orange-200 shadow-sm animate-pulse'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border-2 border-[#E0C7B2] text-[#A66C3E]'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>

                  <div>
                    <h4
                      className={`text-xs sm:text-sm font-bold ${
                        isCurrent
                          ? 'text-[#D9700F] font-black'
                          : isPast
                          ? 'text-[#6B3A0A]'
                          : 'text-[#B39378]'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-[#8C6D53] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-red-50 rounded-3xl p-6 border border-red-200 text-center space-y-2">
          <XCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="font-black text-base text-red-800">Order Cancelled</h3>
          <p className="text-xs text-red-600">
            This order was cancelled and inventory has been automatically restored.
          </p>
        </div>
      )}

      {/* Delivery Rider Details (If assigned) */}
      {rider && (
        <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#8C6D53] tracking-wider">
                Assigned Delivery Rider
              </div>
              <h4 className="font-extrabold text-sm text-[#6B3A0A]">{rider.user.name}</h4>
              <p className="text-xs text-[#8C6D53]">
                {rider.vehicleType} • {rider.vehicleNumber}
              </p>
            </div>
          </div>

          {rider.user.phone && (
            <a
              href={`tel:${rider.user.phone}`}
              className="px-4 py-2 bg-[#FFF2E5] border border-[#D9700F] text-[#D9700F] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#D9700F] hover:text-white transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" /> Call Rider
            </a>
          )}
        </div>
      )}

      {/* Items & Payment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items List */}
        <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card space-y-3">
          <h3 className="font-black text-sm text-[#6B3A0A] border-b border-[#F7E3CF]/50 pb-2">
            Items Ordered ({order.items?.length || 0})
          </h3>
          <div className="space-y-2.5">
            {order.items?.map((it: any) => (
              <div key={it.id} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#6B3A0A]">{it.quantity}x</span>{' '}
                  <span className="text-[#2D1B0D]">{it.productName}</span>
                </div>
                <span className="font-bold text-[#6B3A0A]">₹{it.subtotal}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#F7E3CF] pt-3 space-y-1.5 text-xs text-[#6B3A0A]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-[#8C6D53]">
              <span>Delivery Fee</span>
              <span>₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-[#8C6D53]">
              <span>Taxes</span>
              <span>₹{order.tax}</span>
            </div>
            <div className="border-t border-[#F7E3CF] pt-2 flex justify-between font-black text-sm text-[#D9700F]">
              <span>Total Paid / Payable</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Store & Address Info */}
        <div className="bg-white rounded-3xl p-5 border border-[#F0DEC8] shadow-card space-y-4">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#8C6D53] mb-1">
              Fulfilling Merchant
            </h4>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#D9700F]" />
              <span className="font-black text-sm text-[#6B3A0A]">{order.store?.name}</span>
            </div>
            <p className="text-xs text-[#8C6D53] mt-0.5">{order.store?.address}</p>
          </div>

          <div className="border-t border-[#F7E3CF]/50 pt-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#8C6D53] mb-1">
              Delivery Address
            </h4>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#D9700F] shrink-0 mt-0.5" />
              <div className="text-xs text-[#2D1B0D]">
                <span className="font-bold text-[#6B3A0A] block">{order.address?.label}</span>
                {order.address?.street}, {order.address?.city} - {order.address?.postalCode}
              </div>
            </div>
          </div>

          <div className="border-t border-[#F7E3CF]/50 pt-3 flex items-center justify-between text-xs">
            <span className="text-[#8C6D53]">Payment Method:</span>
            <span className="font-black text-[#6B3A0A]">
              {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Test Online Payment'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
