'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bike,
  Store,
  MapPin,
  Navigation,
  Compass,
  ShieldCheck,
  Radio,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface OrderGpsTrackingMapProps {
  orderId?: string;
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
  orderId,
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

  const [currentRiderLat, setCurrentRiderLat] = useState<number>(riderLat || (sLat + cLat) / 2);
  const [currentRiderLng, setCurrentRiderLng] = useState<number>(riderLng || (sLng + cLng) / 2);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lastSocketPing, setLastSocketPing] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Sync with prop changes if not receiving socket updates
  useEffect(() => {
    if (riderLat && riderLng) {
      setCurrentRiderLat(riderLat);
      setCurrentRiderLng(riderLng);
    }
  }, [riderLat, riderLng]);

  // Haversine Distance in km
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

  const distToCustomer = getDistanceKm(currentRiderLat, currentRiderLng, cLat, cLng);
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
    const remainingRatio = Math.max(0, Math.min(1, distToCustomer / (totalTripDist || 1)));
    progressPct = Math.round(50 + (1 - remainingRatio) * 45);
    statusBanner = `Rider en route to your doorstep • ~${estMins} mins (${distToCustomer.toFixed(1)} km away)`;
    badgeColor = 'bg-orange-100 text-[#D9700F]';
  } else if (orderStatus === 'DELIVERED') {
    progressPct = 100;
    statusBanner = 'Package successfully delivered at your doorstep!';
    badgeColor = 'bg-emerald-100 text-emerald-700';
  }

  // 1. Socket.IO Real-Time Live Tracking
  useEffect(() => {
    if (!orderId || typeof window === 'undefined') return;

    const token = localStorage.getItem('prerna_access_token') || undefined;
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';

    const socket = io(`${socketUrl}/tracking`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit(
        'joinOrderTracking',
        { orderId, token },
        (res: any) => {
          if (res?.latestLocation?.latitude && res?.latestLocation?.longitude) {
            setCurrentRiderLat(res.latestLocation.latitude);
            setCurrentRiderLng(res.latestLocation.longitude);
          }
        },
      );
    });

    socket.on('riderLocationUpdated', (data: any) => {
      if (data?.orderId === orderId && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setCurrentRiderLat(data.latitude);
        setCurrentRiderLng(data.longitude);
        setLastSocketPing(new Date().toLocaleTimeString());

        // Update rider marker position smoothly on Leaflet map
        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLatLng([data.latitude, data.longitude]);
        }
        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs([
            [sLat, sLng],
            [data.latitude, data.longitude],
            [cLat, cLng],
          ]);
        }
      }
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setIsSocketConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveOrderTracking', { orderId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId, sLat, sLng, cLat, cLng]);

  // 2. Leaflet Map Initialization with OpenStreetMap Tiles
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [(sLat + cLat) / 2, (sLng + cLng) / 2],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // 1. Store Marker Icon
      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="
            display: flex; flex-direction: column; align-items: center;
            transform: translate(-50%, -100%);
          ">
            <div style="
              background: #D9700F; color: white; padding: 6px; border-radius: 12px;
              box-shadow: 0 4px 8px rgba(217, 112, 15, 0.4); border: 2px solid white;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div style="border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #D9700F;"></div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });

      L.marker([sLat, sLng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${storeName}</b><br>${storeAddress}`);

      // 2. Customer Drop Marker Icon
      const customerIcon = L.divIcon({
        className: 'custom-customer-pin',
        html: `
          <div style="
            display: flex; flex-direction: column; align-items: center;
            transform: translate(-50%, -100%);
          ">
            <div style="
              background: #059669; color: white; padding: 6px; border-radius: 12px;
              box-shadow: 0 4px 8px rgba(5, 150, 105, 0.4); border: 2px solid white;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style="border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #059669;"></div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });

      L.marker([cLat, cLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>Drop: ${customerLabel}</b><br>${customerAddress}`);

      // 3. Moving Rider Marker Icon with Pulsing Radar
      const riderIcon = L.divIcon({
        className: 'custom-rider-pin',
        html: `
          <div style="
            display: flex; flex-direction: column; align-items: center;
            transform: translate(-50%, -50%); position: relative;
          ">
            <span style="
              position: absolute; width: 44px; height: 44px; border-radius: 50%;
              background: rgba(217, 112, 15, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <div style="
              width: 38px; height: 38px; border-radius: 12px;
              background: linear-gradient(135deg, #D9700F, #ea580c);
              color: white; display: flex; align-items: center; justify-content: center;
              box-shadow: 0 6px 12px rgba(217, 112, 15, 0.4); border: 2.5px solid white;
              position: relative; z-index: 10;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="5.5" cy="17.5" r="3.5"></circle>
                <circle cx="18.5" cy="17.5" r="3.5"></circle>
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h4"></path>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const riderMarker = L.marker([currentRiderLat, currentRiderLng], { icon: riderIcon }).addTo(map);
      riderMarker.bindPopup(`<b>${riderName || 'Delivery Partner'}</b><br>${riderVehicle || 'Two Wheeler'}`);

      // 4. Connecting Route Line
      const routePolyline = L.polyline(
        [
          [sLat, sLng],
          [currentRiderLat, currentRiderLng],
          [cLat, cLng],
        ],
        {
          color: '#D9700F',
          weight: 4,
          opacity: 0.75,
          dashArray: '6, 6',
        },
      ).addTo(map);

      // Fit map bounds to encompass store, rider, and customer drop
      const bounds = L.latLngBounds([
        [sLat, sLng],
        [currentRiderLat, currentRiderLng],
        [cLat, cLng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });

      mapInstanceRef.current = map;
      riderMarkerRef.current = riderMarker;
      routePolylineRef.current = routePolyline;
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0DEC8] shadow-card space-y-4">
      {/* Header with Live Status & Socket Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#D9700F] flex items-center justify-center">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#6B3A0A] flex items-center gap-2">
              <span>Live GPS Order Tracking</span>
              {isSocketConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  <Wifi className="w-2.5 h-2.5" /> Socket Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-[#D9700F]">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Telemetry Polling
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#8C6D53]">
              Real-time rider coordinates powered by Socket.IO & OpenStreetMap
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-extrabold px-3 py-1 rounded-full border border-current/20 ${badgeColor}`}
          >
            {statusBanner}
          </span>
        </div>
      </div>

      {/* Interactive Leaflet Map with OpenStreetMap */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#E8D7C4] shadow-inner bg-[#FAF3EB] isolate z-0">
        {/* Real Leaflet Map Canvas */}
        <div ref={mapContainerRef} style={{ height: '320px', width: '100%' }} />

        {/* Top Floating Map Telemetry Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#F0DEC8] text-[11px] font-bold text-[#6B3A0A] shadow-sm">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-[#D9700F]" />
            <span>
              Rider GPS: {currentRiderLat.toFixed(4)}°N, {currentRiderLng.toFixed(4)}°E
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#8C6D53]">
            <span>
              Distance: <b className="text-[#6B3A0A]">{distToCustomer.toFixed(2)} km</b>
            </span>
            <span>•</span>
            <span>
              ETA: <b className="text-[#D9700F]">~{estMins} Mins</b>
            </span>
            {lastSocketPing && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-[10px] text-emerald-600 font-semibold">
                  Updated: {lastSocketPing}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F0DEC8] shadow-sm flex items-center gap-3 text-[10px] font-black text-[#6B3A0A]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9700F]" /> Store
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" /> Rider
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Customer Drop
          </span>
        </div>
      </div>

      {/* Linear Route Progress Indicator Bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-[#6B3A0A]">
          <span className="flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-[#D9700F]" /> {storeName}
          </span>
          <span className="text-[11px] text-[#8C6D53]">{progressPct}% completed</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {customerLabel}
          </span>
        </div>

        <div className="relative w-full h-2.5 bg-[#E8D5C2] rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-[#D9700F] to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Safety & Contactless Delivery Footnote */}
      <div className="flex items-center justify-between text-[11px] text-[#8C6D53] bg-[#FAF3EB]/50 px-3 py-2 rounded-xl border border-[#F0DEC8]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live encrypted tracking via Socket.IO • Contactless doorstep handover</span>
        </span>
        <span className="font-bold text-[#6B3A0A] hidden sm:inline">
          Rider: {riderName || 'Partner'}
        </span>
      </div>
    </div>
  );
}
