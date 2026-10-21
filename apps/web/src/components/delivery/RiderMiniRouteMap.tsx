'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  Crosshair,
  Clock,
  Gauge,
  Wifi,
  WifiOff,
} from 'lucide-react';

/** Haversine great-circle distance in km */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingToCardinal(deg: number) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function fmtDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function fmtEta(distKm: number, speedKmh?: number) {
  const spd = speedKmh && speedKmh > 2 ? speedKmh : 20;
  const mins = Math.max(1, Math.round((distKm / spd) * 60));
  if (mins < 60) return `~${mins} min`;
  return `~${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const STAGE_ORDER = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

interface RiderMiniRouteMapProps {
  riderLat: number;
  riderLng: number;
  riderHeading?: number;
  storeLat: number;
  storeLng: number;
  customerLat: number;
  customerLng: number;
  storeName: string;
  customerName: string;
  orderNumber: string;
  orderStatus?: string;
  customerAddress?: string;
  riderSpeed?: number;
  isSocketLive?: boolean;
}

export function RiderMiniRouteMap({
  riderLat,
  riderLng,
  riderHeading = 0,
  storeLat,
  storeLng,
  customerLat,
  customerLng,
  storeName,
  customerName,
  orderNumber,
  orderStatus = 'ASSIGNED',
  customerAddress,
  riderSpeed,
  isSocketLive,
}: RiderMiniRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const stageIdx = STAGE_ORDER.indexOf(orderStatus);
  const isHeadingToStore = orderStatus === 'ASSIGNED' || orderStatus === 'PICKED_UP';
  const targetLat = isHeadingToStore ? storeLat : customerLat;
  const targetLng = isHeadingToStore ? storeLng : customerLng;
  const targetLabel = isHeadingToStore ? storeName : customerName;
  const targetSublabel = isHeadingToStore ? 'Pickup Hub' : 'Doorstep Drop';

  const distToTarget = haversine(riderLat, riderLng, targetLat, targetLng);
  const distRiderToStore = haversine(riderLat, riderLng, storeLat, storeLng);
  const distStoreToCustomer = haversine(storeLat, storeLng, customerLat, customerLng);
  const totalRouteDist = distRiderToStore + distStoreToCustomer;
  const legTotal = isHeadingToStore
    ? distRiderToStore + distStoreToCustomer
    : distStoreToCustomer;
  const progressPct = Math.max(
    0,
    Math.min(100, 100 - (distToTarget / Math.max(legTotal, 0.001)) * 100),
  );
  const etaLabel = fmtEta(distToTarget, riderSpeed);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [riderLat, riderLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      // Store Marker
      const storeIcon = L.divIcon({
        className: '',
        html: `<div style="background:#D9700F;color:white;width:30px;height:30px;border-radius:10px;border:2.5px solid white;box-shadow:0 3px 10px rgba(217,112,15,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">🏪</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([storeLat, storeLng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup: ${storeName}</b>`);

      // Customer Doorstep Marker
      const customerIcon = L.divIcon({
        className: '',
        html: `<div style="background:#059669;color:white;width:30px;height:30px;border-radius:10px;border:2.5px solid white;box-shadow:0 3px 10px rgba(5,150,105,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([customerLat, customerLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>Drop: ${customerName}</b><br>${customerAddress || ''}`);

      // Rider Marker with Pulsing Ring & Heading Arrow
      const riderIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:42px;height:42px;">
            <span style="position:absolute;width:42px;height:42px;border-radius:50%;background:rgba(124,58,237,0.25);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
            <div id="mini-needle-${orderNumber}" style="position:absolute;top:-10px;left:50%;transform:translateX(-50%) rotate(${riderHeading}deg);transform-origin:50% 26px;transition:transform 0.5s cubic-bezier(.34,1.56,.64,1);z-index:12;">
              <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid #7C3AED;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));"></div>
            </div>
            <div id="mini-bike-${orderNumber}" style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(124,58,237,0.5);border:2.5px solid white;position:relative;z-index:6;transition:transform 0.5s cubic-bezier(.34,1.56,.64,1);transform:rotate(${riderHeading}deg);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="5.5" cy="17.5" r="3.5"></circle>
                <circle cx="18.5" cy="17.5" r="3.5"></circle>
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h4"></path>
              </svg>
            </div>
          </div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });
      riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);

      // Connecting Polyline with Animated Route
      const polyline = L.polyline(
        [
          [storeLat, storeLng],
          [riderLat, riderLng],
          [customerLat, customerLng],
        ],
        {
          color: '#7C3AED',
          weight: 4,
          dashArray: '6, 6',
          opacity: 0.85,
        }
      ).addTo(map);
      polylineRef.current = polyline;

      // Fit bounds
      const bounds = L.latLngBounds([
        [storeLat, storeLng],
        [riderLat, riderLng],
        [customerLat, customerLng],
      ]);
      map.fitBounds(bounds, { padding: [35, 35] });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [storeLat, storeLng, customerLat, customerLng]);

  // Handle Dynamic Position, Heading, and Map Resizing
  useEffect(() => {
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      const bike = document.getElementById(`mini-bike-${orderNumber}`);
      const needle = document.getElementById(`mini-needle-${orderNumber}`);
      if (bike) bike.style.transform = `rotate(${riderHeading}deg)`;
      if (needle) needle.style.transform = `translateX(-50%) rotate(${riderHeading}deg)`;
    }
    polylineRef.current?.setLatLngs([
      [storeLat, storeLng],
      [riderLat, riderLng],
      [customerLat, customerLng],
    ]);
  }, [riderLat, riderLng, riderHeading, storeLat, storeLng, customerLat, customerLng, orderNumber]);

  // Invalidate map size when expanded / collapsed
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
    }
  }, [isExpanded]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([riderLat, riderLng], 15, { animate: true, duration: 0.8 });
    }
  };

  const stages = [
    { key: 'ASSIGNED', icon: '📦', label: 'Assigned' },
    { key: 'PICKED_UP', icon: '🏪', label: 'At Store' },
    { key: 'OUT_FOR_DELIVERY', icon: '🛵', label: 'On Route' },
    { key: 'DELIVERED', icon: '✅', label: 'Delivered' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-[#F0DEC8] shadow-inner bg-[#FAF3EB] transition-all duration-300">
      {/* Map Canvas + overlaid controls */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          style={{ height: isExpanded ? '300px' : '180px', width: '100%' }}
          className="transition-all duration-300"
        />

        {/* Top Bar: Destination Chip + Controls */}
        <div className="absolute top-2 left-2 right-2 z-[400] flex items-start justify-between gap-2 pointer-events-none">
          {/* Destination Chip */}
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#F0DEC8] shadow-md pointer-events-auto flex flex-col gap-0.5 max-w-[65%]">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-purple-700 shrink-0" />
              <span className="text-[10px] font-black text-purple-700 uppercase tracking-wide">
                {targetSublabel}
              </span>
              {/* WebSocket indicator */}
              {isSocketLive !== undefined && (
                isSocketLive ? (
                  <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    <Wifi className="w-2 h-2" /> WS
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-black text-[#D9700F] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                    <WifiOff className="w-2 h-2" /> WS
                  </span>
                )
              )}
            </div>
            <span className="text-[11px] font-extrabold text-[#6B3A0A] truncate">{targetLabel}</span>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-purple-700">
                <MapPin className="w-2.5 h-2.5" />
                {fmtDist(distToTarget)}
              </span>
              <span className="text-[#8C6D53]">•</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <Clock className="w-2.5 h-2.5" />
                {etaLabel}
              </span>
            </div>
          </div>

          {/* Map Controls */}
          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleRecenter}
              title="Re-center on your location"
              className="p-1.5 bg-white/95 hover:bg-white text-[#6B3A0A] hover:text-purple-700 rounded-xl border border-[#F0DEC8] shadow-sm transition-all"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse map' : 'Expand map'}
              className="p-1.5 bg-white/95 hover:bg-white text-[#6B3A0A] hover:text-purple-700 rounded-xl border border-[#F0DEC8] shadow-sm transition-all"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Stage Stepper + Telemetry */}
      <div className="bg-white/95 backdrop-blur-md border-t border-[#F0DEC8] px-3 py-2 space-y-2">
        {/* Turn-by-Turn Stage Stepper */}
        <div className="flex items-center justify-between gap-1">
          {stages.map((s, i) => {
            const done = stageIdx > i;
            const active = stageIdx === i;
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-content:center text-[12px] border-2 transition-all duration-300 ${
                      done
                        ? 'bg-emerald-500 border-emerald-500'
                        : active
                        ? 'bg-purple-700 border-purple-700 scale-110 shadow-sm shadow-purple-300'
                        : 'bg-[#FAF3EB] border-[#E0C9A8] opacity-60'
                    }`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {done ? '✓' : s.icon}
                  </div>
                  <span
                    className={`text-[9px] font-bold text-center leading-tight ${
                      active ? 'text-purple-700' : done ? 'text-emerald-600' : 'text-[#B09070]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < stages.length - 1 && (
                  <div className="flex-1 h-0.5 mb-4 rounded-full overflow-hidden bg-[#F0DEC8]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: done ? '100%' : active ? `${progressPct}%` : '0%',
                        background: done
                          ? '#10b981'
                          : 'linear-gradient(90deg, #7C3AED, #a855f7)',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Telemetry Row */}
        <div className="flex items-center justify-between text-[9px] font-bold text-[#8C6D53]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-purple-700">
              <Compass
                className="w-3 h-3 transition-transform duration-500"
                style={{ transform: `rotate(${riderHeading}deg)` }}
              />
              {Math.round(riderHeading)}° {bearingToCardinal(riderHeading)}
            </span>
            {riderSpeed != null && riderSpeed > 0 && (
              <span className="flex items-center gap-1 text-[#D9700F]">
                <Gauge className="w-3 h-3" />
                {Math.round(riderSpeed)} km/h
              </span>
            )}
            <span className="hidden sm:inline">
              Trip: <b className="text-[#6B3A0A]">{fmtDist(totalRouteDist)}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D9700F] inline-block" /> Store</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7C3AED] inline-block" /> You</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#059669] inline-block" /> Drop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
