'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  KeyRound,
  Lock,
  Search,
  BellRing,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OrderGpsTrackingMap } from '@/components/orders/OrderGpsTrackingMap';
import { useOrderTracking } from '@/lib/hooks/useOrderTracking';

// Customer-facing delivery flow. Maps onto the existing OrderStatus enum (no new statuses):
// PENDING/CONFIRMED/PREPARING/READY_FOR_PICKUP -> waiting, ASSIGNED -> accepted,
// PICKED_UP -> rider started, OUT_FOR_DELIVERY -> on the way / reached, DELIVERED.
const ORDER_STEPS = [
  { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Your order has been received' },
  { key: 'PENDING', label: 'Waiting for Delivery Partner', desc: 'Finding a delivery partner near you' },
  { key: 'ACCEPTED', label: 'Delivery Partner Assigned', desc: 'A rider has accepted your order' },
  { key: 'RIDER_STARTED', label: 'Your Rider Is On The Way', desc: 'Rider has started towards you' },
  { key: 'ON_THE_WAY', label: 'Order Is On The Way', desc: 'Rider is heading to your location' },
  { key: 'REACHED_DESTINATION', label: 'Rider Reached Your Location', desc: 'Share your PIN to receive the order' },
  { key: 'DELIVERED', label: 'Order Delivered', desc: 'Handed over at doorstep' },
];

const WAITING_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'];
const REACHED_MARKER = 'REACHED_DESTINATION';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [cancelling, setCancelling] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const { data: order, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/${orderId}`),
    refetchInterval: 4000, // Fallback poll; Socket.IO events below make updates instant
  });

  // Real-time updates (acceptance notification, status changes, rider movement)
  const realOrderId: string | undefined = order?.id;
  const { isConnected, joinError, acceptedEvent, riderEvent, liveStatus } = useOrderTracking({
    orderId: realOrderId,
    onOrderChanged: () => {
      refetch();
    },
  });

  // "Order Picked!" notification: shown when acceptance happens while this page is open
  const [showAcceptedBanner, setShowAcceptedBanner] = useState(false);
  const wasAcceptedRef = useRef(false);
  const isAccepted = !!order?.deliveryAssignment;
  useEffect(() => {
    if (!order) return;
    if (wasAcceptedRef.current === false && isAccepted) setShowAcceptedBanner(true);
    wasAcceptedRef.current = isAccepted;
  }, [order, isAccepted]);
  useEffect(() => {
    if (acceptedEvent) setShowAcceptedBanner(true);
  }, [acceptedEvent]);
  useEffect(() => {
    if (!showAcceptedBanner) return;
    const t = setTimeout(() => setShowAcceptedBanner(false), 12000);
    return () => clearTimeout(t);
  }, [showAcceptedBanner]);

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

  // A socket status event is applied immediately; the persisted order catches up on the next refetch.
  const effectiveStatus: string = liveStatus || order.status;
  const isCancelled = effectiveStatus === 'CANCELLED';
  const hasAssignment = !!order.deliveryAssignment;
  const isWaitingForPartner = !hasAssignment && WAITING_STATUSES.includes(order.status);
  // Show the customer map as soon as the rider accepts the order.
  const trackingUnlocked =
    hasAssignment && ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(effectiveStatus) && !isCancelled;
  const reachedDestination =
    riderEvent?.stage != null
      ? riderEvent.stage === REACHED_MARKER
      : order.deliveryAssignment?.notes === REACHED_MARKER;

  let currentStatusIndex = 1; // waiting for delivery partner
  if (effectiveStatus === 'DELIVERED') currentStatusIndex = 6;
  else if (effectiveStatus === 'OUT_FOR_DELIVERY') currentStatusIndex = reachedDestination ? 5 : 4;
  else if (effectiveStatus === 'PICKED_UP') currentStatusIndex = 3;
  else if (effectiveStatus === 'ASSIGNED') currentStatusIndex = 2;
  const canCancel = !hasAssignment && (order.status === 'PENDING' || order.status === 'CONFIRMED');

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
  const otpPin = order.deliveryPin || (order.orderNumber ? order.orderNumber.replace(/\D/g, '').slice(-4) || '4829' : '4829');

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
                  : effectiveStatus === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-[#D9700F]'
              }`}
            >
              {isWaitingForPartner ? 'WAITING FOR DELIVERY PARTNER' : effectiveStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-[#8C6D53] mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()} • {order.items?.length || 0} items
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
      </div>

      {/* Real-time acceptance notification */}
      {showAcceptedBanner && !isCancelled && (
        <div className="relative bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 shadow-card flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="pr-6">
            <h3 className="font-black text-base text-emerald-900">Order Picked!</h3>
            <p className="text-xs text-emerald-800 font-medium">
              Your Rider Is On The Way.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAcceptedBanner(false)}
            className="absolute top-3 right-3 p-1 rounded-full text-emerald-700 hover:bg-emerald-100"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Before a delivery partner accepts: clean waiting screen only (no map, no rider data) */}
      {isWaitingForPartner && !isCancelled && (
        <div className="bg-white rounded-3xl p-8 border border-[#F0DEC8] shadow-card text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <span className="absolute inset-0 rounded-full bg-orange-100 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-[#FFF2E5] border-2 border-[#D9700F]/40 text-[#D9700F] flex items-center justify-center">
              <Search className="w-8 h-8" />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Order Confirmed
          </div>
          <div>
            <h2 className="text-xl font-black text-[#6B3A0A]">Waiting for Delivery Partner</h2>
            <p className="text-sm text-[#8C6D53] mt-1">Finding a delivery partner for your order...</p>
          </div>
          <p className="text-xs text-[#A66C3E] max-w-md mx-auto">
            Live tracking will appear here automatically as soon as a delivery partner accepts your order. You don't
            need to refresh this page.
          </p>
        </div>
      )}

      {joinError && !isWaitingForPartner && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-[#6B3A0A] font-semibold">
          Live updates are unavailable ({joinError}). Showing the latest saved status.
        </div>
      )}

      {/* Dedicated Customer Doorstep Delivery PIN / OTP Banner */}
      {!isCancelled && hasAssignment && (
        <div className="bg-gradient-to-r from-[#FFF5EB] via-[#FAF3EB] to-[#FFF9F5] rounded-3xl p-5 sm:p-6 border-2 border-[#D9700F]/40 shadow-soft relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#D9700F]/5 rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D9700F] to-[#B85B07] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#D9700F] bg-orange-100/80 px-2.5 py-0.5 rounded-full">
                    Doorstep Delivery Security PIN
                  </span>
                  {effectiveStatus === 'OUT_FOR_DELIVERY' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                      ● Rider Arriving Soon
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#6B3A0A]">
                  Share this 4-Digit OTP with the Delivery Partner
                </h3>
                <p className="text-xs text-[#8C6D53] max-w-lg leading-relaxed">
                  To ensure safe, contactless handover and verify your package, provide this one-time PIN only when the rider arrives at your doorstep.
                </p>
              </div>
            </div>

            {/* OTP Code Box & Copy */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              {effectiveStatus === 'DELIVERED' ? (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Verified & Delivered</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 bg-white px-4 py-2.5 rounded-2xl border-2 border-[#D9700F] shadow-sm">
                    {otpPin.split('').map((digit: string, idx: number) => (
                      <span
                        key={idx}
                        className="w-8 h-9 flex items-center justify-center font-black text-xl text-[#D9700F] bg-[#FAF3EB] rounded-lg tracking-wider"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(otpPin);
                        setCopiedOtp(true);
                        setTimeout(() => setCopiedOtp(false), 2000);
                      }
                    }}
                    title="Copy Delivery PIN"
                    className="p-3 bg-white border border-[#F0DEC8] hover:border-[#D9700F] text-[#6B3A0A] hover:text-[#D9700F] rounded-2xl shadow-sm transition-all flex items-center justify-center"
                  >
                    {copiedOtp ? (
                      <span className="text-[11px] font-bold text-emerald-600 px-1">Copied!</span>
                    ) : (
                      <KeyRound className="w-4 h-4 text-[#D9700F]" />
                    )}
                  </button>
                </div>
              )}

              <span className="text-[11px] font-medium text-[#8C6D53]">
                {effectiveStatus === 'DELIVERED'
                  ? 'Delivery confirmed successfully'
                  : 'Valid until order handover is complete'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live GPS Route Tracking Map - unlocked only after a delivery partner accepts */}
      {trackingUnlocked && (
        <OrderGpsTrackingMap
          orderStatus={effectiveStatus}
          riderName={rider?.user?.name}
          riderVehicle={rider?.vehicleType ? `${rider.vehicleType} (${rider.vehicleNumber || ''})` : undefined}
          riderLat={delivery?.currentLat ?? rider?.currentLat}
          riderLng={delivery?.currentLng ?? rider?.currentLng}
          assignedAt={delivery?.assignedAt}
          routeOriginLat={order.store?.latitude}
          routeOriginLng={order.store?.longitude}
          liveEvent={riderEvent}
          isSocketConnected={isConnected}
          customerLat={order.address?.latitude}
          customerLng={order.address?.longitude}
          customerAddress={order.address?.street}
          customerLabel={order.address?.label}
          reachedDestination={reachedDestination}
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
              {isWaitingForPartner ? 'Awaiting rider' : '⚡ Rider assigned'}
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
              <div className="flex flex-col"><span>GST (CGST 2.5% + SGST 2.5%)</span><span className="text-[10px] text-[#A66C3E]">Tax Invoice • MRP incl. item GST</span></div>
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