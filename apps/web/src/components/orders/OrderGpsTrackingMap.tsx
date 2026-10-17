'use client';

import React from 'react';
import { Bike, Store, MapPin, Navigation, Compass, ShieldCheck } from 'lucide-react';

interface OrderGpsTrackingMapProps {
  orderStatus: string;
  storeName?: string;
  storeAddress?: string;
  customerAddress?: string;
  customerLabel?: string;
  riderName?: string;
  riderVehicle?: string;
  riderLat?: number | null;
  riderLng?: number | null;
  storeLat?: number | null;
  storeLng?: number | null;
  customerLat?: number | null;
  customerLng?: number | null;
}

export function OrderGpsTrackingMap({
  orderStatus,
  storeName = 'Sunrise Fresh Market',
  storeAddress = 'DLF Galleria, Sector 28',
  customerAddress = 'Sector 25, DLF Phase 2',
  customerLabel = 'Home',
  riderName,
  riderVehicle,
  riderLat = 28.4612,
  riderLng = 77.0305,
  storeLat = 28.4595,
  storeLng = 77.0266,
  customerLat = 28.4682,
  customerLng = 77.0384,
}: OrderGpsTrackingMapProps) {
  // Safe coordinate fallbacks
  const sLat = storeLat || 28.4595;
  const sLng = storeLng || 77.0266;
  const cLat = customerLat || 28.4682;
  const cLng = customerLng || 77.0384;
  const rLat = riderLat || (sLat + cLat) / 2;
  const rLng = riderLng || (sLng + cLng) / 2;

  // Calculate Haversine Distance in km
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distToCustomer = getDistanceKm(rLat, rLng, cLat, cLng);
  const totalTripDist = getDistanceKm(sLat, sLng, cLat, cLng);
  const estMins = Math.max(2, Math.round(distToCustomer * 3.5));

  // Determine progress percentage based on order lifecycle
  let progressPct = 20;
  let statusBanner = 'Looking for nearby delivery partner...';
  let badgeColor = 'bg-amber-100 text-[#D9700F]';

  if (orderStatus === 'ASSIGNED') {
    progressPct = 35;
    statusBanner = `Rider ${riderName || 'Partner'} assigned • Driving to store for pickup`;
    badgeColor = 'bg-purple-100 text-purple-700';
  } else if (orderStatus === 'PICKED_UP') {
    progressPct = 50;
    statusBanner = `Order picked up at ${storeName} • Packing checked`;
    badgeColor = 'bg-blue-100 text-blue-700';
  } else if (orderStatus === 'OUT_FOR_DELIVERY') {
    // calculate proportional progress
    const remainingRatio = Math.max(0, Math.min(1, distToCustomer / (totalTripDist || 1)));
    progressPct = Math.round(50 + (1 - remainingRatio) * 45);
    statusBanner = `Rider en route to your doorstep • ~${estMins} mins (${distToCustomer.toFixed(1)} km away)`;
    badgeColor = 'bg-orange-100 text-[#D9700F]';
  } else if (orderStatus === 'DELIVERED') {
    progressPct = 100;
    statusBanner = 'Package successfully delivered at your doorstep!';
    badgeColor = 'bg-emerald-100 text-emerald-700';
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0DEC8] shadow-card space-y-4">
      {/* Header with Live GPS Radar Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#D9700F] flex items-center justify-center">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#6B3A0A] flex items-center gap-1.5">
              <span>Live GPS Order Tracking</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[11px] text-[#8C6D53]">Real-time rider coordinates & route telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border border-current/20 ${badgeColor}`}>
            {statusBanner}
          </span>
        </div>
      </div>

      {/* Stylized Visual GPS Map Canvas */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-[#F4EBE1] border border-[#E8D7C4] p-4 flex flex-col justify-between shadow-inner">
        {/* Subtle grid map pattern background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#6B3A0A 1px, transparent 1px), radial-gradient(#6B3A0A 1px, #F4EBE1 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px',
          }}
        />

        {/* Top Floating Map Telemetry Bar */}
        <div className="relative z-10 flex items-center justify-between bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#F0DEC8] text-[11px] font-bold text-[#6B3A0A] shadow-sm">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-[#D9700F]" />
            <span>GPS: {rLat.toFixed(4)}°N, {rLng.toFixed(4)}°E</span>
          </div>
          <div className="flex items-center gap-2 text-[#8C6D53]">
            <span>Distance: <b className="text-[#6B3A0A]">{distToCustomer.toFixed(2)} km</b></span>
            <span>•</span>
            <span>Speed: <b className="text-[#6B3A0A]">28 km/h</b></span>
          </div>
        </div>

        {/* Center Route Diagram */}
        <div className="relative z-10 my-auto py-4">
          {/* Animated Connecting Track */}
          <div className="relative w-full h-3 bg-[#E8D5C2] rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Interactive Route Pins */}
          <div className="relative w-full flex justify-between items-center -mt-5">
            {/* Store Pin (Left) */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 ring-4 ring-white">
                <Store className="w-4 h-4" />
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[10px] font-black text-[#6B3A0A] block truncate max-w-[90px]">{storeName}</span>
                <span className="text-[9px] text-[#8C6D53] block truncate max-w-[90px]">Store Hub</span>
              </div>
            </div>

            {/* Moving Rider Scooter (Dynamic Position based on progressPct) */}
            <div
              className="absolute flex flex-col items-center transition-all duration-700 ease-out -translate-x-1/2"
              style={{ left: `${Math.max(12, Math.min(88, progressPct))}%` }}
            >
              <div className="relative">
                {/* Radar ring animation */}
                <span className="animate-ping absolute -inset-1 rounded-full bg-orange-400 opacity-60"></span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D9700F] to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 ring-4 ring-white relative z-10">
                  <Bike className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-1 text-center bg-white/95 px-2 py-0.5 rounded-lg border border-orange-200 shadow-sm">
                <span className="text-[10px] font-black text-[#D9700F] block">
                  {riderName || 'Partner'}
                </span>
                <span className="text-[8px] font-bold text-gray-500 block">
                  {orderStatus === 'DELIVERED' ? 'Arrived' : `~${estMins}m away`}
                </span>
              </div>
            </div>

            {/* Customer Drop Pin (Right) */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 ring-4 ring-white">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[10px] font-black text-[#6B3A0A] block truncate max-w-[90px]">{customerLabel}</span>
                <span className="text-[9px] text-[#8C6D53] block truncate max-w-[90px]">Drop Location</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Route Summary Footnote */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-[#8C6D53] bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#F0DEC8]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Contactless delivery & thermal insulated packaging verified
          </span>
          <span className="font-bold text-[#6B3A0A]">
            Delivery Hub: DLF Phase 1-5, Gurugram
          </span>
        </div>
      </div>
    </div>
  );
}
