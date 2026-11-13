'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Compass, Navigation, Radio, Wifi, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import type { RiderLiveEvent } from '@/lib/hooks/useOrderTracking';
import {
  distanceAlongRoute,
  fetchRoadRoute,
  formatDistance,
  isValidCoord,
  pointAtDistance,
  routeLength,
  type LatLng,
  type RoadRoute,
} from '@/lib/osrm';

interface OrderGpsTrackingMapProps {
  orderStatus: string;
  riderName?: string;
  riderVehicle?: string;
  /** Last persisted rider position (REST) - used after a page refresh. */
  riderLat?: number | null;
  riderLng?: number | null;
  /** Live rider event streamed through Socket.IO. */
  liveEvent?: RiderLiveEvent | null;
  isSocketConnected?: boolean;
  /** Store coordinates: the route starts at pickup, not the rider's earlier GPS position. */
  routeOriginLat?: number | null;
  routeOriginLng?: number | null;
  assignedAt?: string | Date | null;
  /** Customer checkout GPS coordinates (final destination). */
  customerLat?: number | null;
  customerLng?: number | null;
  customerAddress?: string;
  customerLabel?: string;
  reachedDestination?: boolean;
}

const RIDER_ICON_HTML = `<div style="background:#D9700F;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 4px 10px rgba(217,112,15,.45)">🏍️</div>`;
const HOME_ICON_HTML = `<div style="background:#059669;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 4px 10px rgba(5,150,105,.4)">🏠</div>`;

const ANIMATION_MS = 1000;
const SIMULATION_DURATION_MS = 5 * 60 * 1000;

/**
 * Customer-facing live tracking map. Only rendered after the rider confirms store pickup.
 * Shows the rider on the real OSRM road route to the customer's checkout GPS. It has no controls:
 * the virtual demo rider is driven from the delivery partner's dashboard.
 */
export function OrderGpsTrackingMap({
  orderStatus,
  riderName,
  riderVehicle,
  riderLat,
  riderLng,
  liveEvent,
  isSocketConnected,
  routeOriginLat,
  routeOriginLng,
  assignedAt,
  customerLat,
  customerLng,
  customerAddress,
  customerLabel = 'Home',
  reachedDestination,
}: OrderGpsTrackingMapProps) {
  const destValid = isValidCoord(customerLat, customerLng);
  const destination: LatLng | null = destValid ? [customerLat as number, customerLng as number] : null;
  const routeOrigin: LatLng | null = isValidCoord(routeOriginLat, routeOriginLng)
    ? [routeOriginLat as number, routeOriginLng as number]
    : null;

  // Live socket event wins; after refresh, the persisted acceptance time reconstructs the demo position.
  const savedOrLivePos: LatLng | null =
    liveEvent && isValidCoord(liveEvent.latitude, liveEvent.longitude)
      ? [liveEvent.latitude, liveEvent.longitude]
      : isValidCoord(riderLat, riderLng)
      ? [riderLat as number, riderLng as number]
      : null;

  const [route, setRoute] = useState<RoadRoute | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [displayProgress, setDisplayProgress] = useState<number | null>(null);
  const [displayRemaining, setDisplayRemaining] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    if (!assignedAt || !['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(orderStatus)) return;
    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [assignedAt, orderStatus]);

  const parsedStart = assignedAt ? new Date(assignedAt).getTime() : Number.NaN;
  const hasAcceptedAt = Number.isFinite(parsedStart);
  const elapsedMs = hasAcceptedAt ? Math.max(0, clockNow - parsedStart) : 0;
  const simulationProgress = hasAcceptedAt ? Math.min(1, elapsedMs / SIMULATION_DURATION_MS) : null;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const travelledLineRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const currentDistRef = useRef(0);
  const originRef = useRef<LatLng | null>(null); // first rider position: route origin
  const fittedRef = useRef(false);

  // Prefer the pickup store as the route origin; otherwise use the first rider GPS fix.
  if (routeOrigin) originRef.current = routeOrigin;
  else if (savedOrLivePos && !originRef.current) originRef.current = savedOrLivePos;

  const timeDrivenPos = route && simulationProgress !== null
    ? pointAtDistance(route, routeLength(route) * simulationProgress).position
    : null;
  const livePos = liveEvent?.source === 'SIMULATION' ? savedOrLivePos : timeDrivenPos || savedOrLivePos;
  const isSimulation = liveEvent?.source === 'SIMULATION' || !!timeDrivenPos;

  const loadRoute = useCallback(async () => {
    const origin = routeOrigin || originRef.current;
    if (!origin || !destination) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const r = await fetchRoadRoute(origin, destination);
      setRoute(r);
    } catch (e: any) {
      setRoute(null);
      setRouteError(e?.message || 'Unable to load the road route.');
    } finally {
      setRouteLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerLat, customerLng, routeOriginLat, routeOriginLng]);

  const hasOrigin = !!originRef.current;
  useEffect(() => {
    if (hasOrigin && destValid && !route && !routeLoading && !routeError) {
      loadRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOrigin, destValid, loadRoute]);

  // Leaflet init
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!mapContainerRef.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled || !mapContainerRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        center: destination || [28.4595, 77.0266],
        zoom: 14,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    }
    init();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      riderMarkerRef.current = null;
      destMarkerRef.current = null;
      routeLineRef.current = null;
      travelledLineRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Destination marker
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !destination) return;
    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng(destination);
    } else {
      destMarkerRef.current = L.marker(destination, {
        icon: L.divIcon({ className: '', html: HOME_ICON_HTML, iconSize: [36, 36], iconAnchor: [18, 18] }),
      })
        .addTo(map)
        .bindPopup(`<b>${customerLabel}</b><br/>Your delivery location`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, customerLat, customerLng]);

  // Route polyline
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;
    [routeLineRef, travelledLineRef].forEach((ref) => {
      if (ref.current) {
        map.removeLayer(ref.current);
        ref.current = null;
      }
    });
    if (!route) return;
    routeLineRef.current = L.polyline(route.coordinates, { color: '#D9700F', weight: 5, opacity: 0.85 }).addTo(map);
    travelledLineRef.current = L.polyline([route.coordinates[0]], {
      color: '#6B3A0A',
      weight: 5,
      opacity: 0.9,
    }).addTo(map);
    if (!fittedRef.current) {
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [30, 30] });
      fittedRef.current = true;
    }
  }, [mapReady, route]);

  const placeRider = useCallback(
    (pos: LatLng, heading?: number) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = L.marker(pos, {
          icon: L.divIcon({ className: '', html: RIDER_ICON_HTML, iconSize: [36, 36], iconAnchor: [18, 18] }),
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup('<b>Your delivery partner</b>');
      } else {
        riderMarkerRef.current.setLatLng(pos);
      }
      void heading;
    },
    [],
  );

  // Move the rider marker whenever a new position arrives
  const lat = livePos?.[0];
  const lng = livePos?.[1];
  useEffect(() => {
    if (!mapReady || lat === undefined || lng === undefined) return;
    const target: LatLng = [lat, lng];

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Real GPS (or no route yet): show the exact reported position
    if (!route || !isSimulation) {
      placeRider(target);
      if (route) {
        const d = distanceAlongRoute(route, target);
        currentDistRef.current = d;
        const total = routeLength(route);
        setDisplayRemaining(Math.max(0, total - d));
        setDisplayProgress(total > 0 ? Math.min(100, Math.round((d / total) * 100)) : null);
      }
      return;
    }

    // Virtual rider: glide along the ROAD geometry (never a straight line between two points)
    const total = routeLength(route);
    const fromDist = currentDistRef.current;
    const toDist = Math.max(0, Math.min(total, distanceAlongRoute(route, target)));
    if (toDist < fromDist - 1) {
      // replay / reset: jump back
      currentDistRef.current = toDist;
    }
    const startDist = currentDistRef.current;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / ANIMATION_MS);
      const d = startDist + (toDist - startDist) * t;
      currentDistRef.current = d;
      const { position, heading } = pointAtDistance(route, d);
      placeRider(position, heading);
      if (travelledLineRef.current) {
        let idx = 0;
        while (idx < route.cumulative.length - 1 && route.cumulative[idx + 1] <= d) idx++;
        travelledLineRef.current.setLatLngs([...route.coordinates.slice(0, idx + 1), position]);
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    setDisplayProgress(
      typeof liveEvent?.progress === 'number'
        ? Math.round(liveEvent.progress)
        : total > 0
        ? Math.round((toDist / total) * 100)
        : null,
    );
    setDisplayRemaining(
      typeof liveEvent?.remainingMeters === 'number' ? liveEvent.remainingMeters : Math.max(0, total - toDist),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, lat, lng, route, isSimulation]);

  const statusLine = reachedDestination
    ? 'Your rider has reached your location'
    : orderStatus === 'OUT_FOR_DELIVERY'
    ? 'Your order is on the way'
    : orderStatus === 'PICKED_UP'
    ? 'Your rider is on the way'
    : 'Your delivery partner has been assigned';
  const etaSeconds = Math.max(0, Math.ceil((SIMULATION_DURATION_MS - elapsedMs) / 1000));
  const etaLabel = etaSeconds <= 10 ? 'Arriving Now' : `Reaching in ${Math.max(1, Math.ceil(etaSeconds / 60))} min`;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0DEC8] shadow-card space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0DEC8]/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF2E5] text-[#D9700F] flex items-center justify-center shrink-0 border border-[#F0DEC8]">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#6B3A0A]">Live Delivery Tracking</h2>
              {isSocketConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Wifi className="w-2.5 h-2.5" /> Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-[#D9700F] border border-orange-200">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Reconnecting
                </span>
              )}
            </div>
            <p className="text-xs text-[#8C6D53]">{statusLine}{hasAcceptedAt && !reachedDestination ? ` · ${etaLabel}` : ''}</p>
          </div>
        </div>

        {destValid && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 sm:text-right">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 block">
              Delivery GPS Destination
            </span>
            <span className="text-xs font-black text-[#6B3A0A]">
              {(customerLat as number).toFixed(5)}° N, {(customerLng as number).toFixed(5)}° E
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-96 rounded-2xl border border-[#F0DEC8] overflow-hidden z-0"
        />
        {!livePos && (
          <div className="absolute inset-x-3 bottom-3 z-[500] px-3 py-2 rounded-xl bg-white/95 border border-[#F0DEC8] text-[11px] font-semibold text-[#6B3A0A] flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#D9700F] animate-pulse" />
            Waiting for your rider's GPS location...
          </div>
        )}
      </div>

      {routeLoading && (
        <p className="text-[11px] text-[#8C6D53] flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#D9700F]" /> Loading road route...
        </p>
      )}
      {routeError && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold">{routeError}</span>
          <button
            type="button"
            onClick={loadRoute}
            className="px-2.5 py-1 bg-white border border-red-300 rounded-lg font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
      {!destValid && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-semibold">
          Delivery GPS coordinates are unavailable for this order.
        </div>
      )}

      {/* Progress */}
      {(displayProgress !== null || displayRemaining !== null) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#6B3A0A]">
            <span>Route progress: {displayProgress ?? 0}%</span>
            <span>{displayRemaining !== null ? `${formatDistance(displayRemaining)} remaining` : ''}</span>
          </div>
          <div className="h-2.5 bg-[#F7E3CF] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D9700F] to-emerald-500 transition-[width] duration-700"
              style={{ width: `${displayProgress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Info row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-[#FAF3EB]/60 border border-[#F0DEC8]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D53]">Delivery Partner</div>
          <div className="font-black text-[#6B3A0A] mt-0.5">{riderName || 'Assigned rider'}</div>
          {riderVehicle && <div className="text-[#8C6D53]">{riderVehicle}</div>}
        </div>
        <div className="p-3 rounded-2xl bg-[#FAF3EB]/60 border border-[#F0DEC8]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D53]">Delivering To</div>
          <div className="font-black text-[#6B3A0A] mt-0.5 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-emerald-600" /> {customerLabel}
          </div>
          {customerAddress && <div className="text-[#8C6D53] truncate">{customerAddress}</div>}
        </div>
      </div>

      {isSimulation && (
        <p className="text-[10px] text-[#8C6D53] leading-relaxed">
          <b>Demo notice:</b> the rider shown on this map is a <b>virtual rider simulation</b> following the real road
          route. It is not real GPS movement.
        </p>
      )}
    </div>
  );
}