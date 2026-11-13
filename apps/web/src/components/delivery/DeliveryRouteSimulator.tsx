'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Compass,
  Navigation,
  Play,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Wifi,
  WifiOff,
  Bike,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRiderSocket } from '@/lib/hooks/useRiderSocket';
import {
  fetchRoadRoute,
  formatDistance,
  isValidCoord,
  pointAtDistance,
  routeLength,
  type LatLng,
  type RoadRoute,
} from '@/lib/osrm';

interface DeliveryRouteSimulatorProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  customerName?: string;
  /** Store pickup coordinates: OSRM simulation should follow the shop-to-customer route. */
  routeOriginLat?: number | null;
  routeOriginLng?: number | null;
  assignedAt?: string | Date | null;
  /** Customer's checkout GPS coordinates (final delivery destination). */
  destinationLat?: number | null;
  destinationLng?: number | null;
  /** Advances the real order status via the existing delivery API. Resolves true on success. */
  onUpdateStatus: (orderId: string, status: string, notes?: string) => Promise<boolean>;
  /** Reports the latest rider GPS so the dashboard can show it. */
  onGpsCaptured?: (lat: number, lng: number) => void;
  onSimulatingChange?: (isSimulating: boolean) => void;
}

type GpsState = 'locating' | 'ok' | 'error';
type RouteState = 'idle' | 'loading' | 'ready' | 'error';

const TICK_MS = 50; // marker animation step
const EMIT_MS = 1000; // socket broadcast cadence
const SIMULATION_DURATION_MS = 5 * 60 * 1000;

const RIDER_ICON_HTML = `<div style="background:#D9700F;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;border:3px solid #fff;box-shadow:0 4px 10px rgba(217,112,15,.45)">🏍️</div>`;
const HOME_ICON_HTML = `<div style="background:#059669;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;border:3px solid #fff;box-shadow:0 4px 10px rgba(5,150,105,.4)">🏠</div>`;

export function DeliveryRouteSimulator({
  orderId,
  orderNumber,
  orderStatus,
  customerName = 'Customer',
  routeOriginLat,
  routeOriginLng,
  assignedAt,
  destinationLat,
  destinationLng,
  onUpdateStatus,
  onGpsCaptured,
  onSimulatingChange,
}: DeliveryRouteSimulatorProps) {
  const destValid = isValidCoord(destinationLat, destinationLng);
  const destination: LatLng | null = destValid
    ? [destinationLat as number, destinationLng as number]
    : null;
  const routeOrigin: LatLng | null = isValidCoord(routeOriginLat, routeOriginLng)
    ? [routeOriginLat as number, routeOriginLng as number]
    : null;

  const socketStreamReadyRef = useRef(false);
  const { isConnected: isSocketLive, emitLocation } = useRiderSocket({
    orderId,
    onAck: (res) => {
      socketStreamReadyRef.current = res.success;
    },
  });
  const emitRef = useRef(emitLocation);
  emitRef.current = emitLocation;
  const gpsCapturedRef = useRef(onGpsCaptured);
  gpsCapturedRef.current = onGpsCaptured;

  // Rider starting GPS (the delivery partner's real device location - never the store)
  const [gpsState, setGpsState] = useState<GpsState>('locating');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);

  // OSRM road route
  const [routeState, setRouteState] = useState<RouteState>('idle');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [route, setRoute] = useState<RoadRoute | null>(null);

  // Virtual simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [remainingMeters, setRemainingMeters] = useState<number | null>(null);
  const [clockNow, setClockNow] = useState(Date.now());

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const travelledLineRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Single-interval guards
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEmitRef = useRef(0);
  const mountedRef = useRef(true);
  const autoStartRef = useRef(false);
  const completionSentRef = useRef(false);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  // Cleanup everything on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTick();
    };
  }, [clearTick]);

  useEffect(() => {
    onSimulatingChange?.(isSimulating);
  }, [isSimulating, onSimulatingChange]);

  useEffect(() => {
    if (!['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(orderStatus)) return;
    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [orderStatus]);

  // Start the virtual rider at the pickup store's saved GPS, not the browser device.
  const captureGps = useCallback(() => {
    if (!isValidCoord(routeOriginLat, routeOriginLng)) {
      setGpsState('error');
      setGpsError('Store pickup GPS coordinates are missing.');
      return;
    }
    const lat = routeOriginLat as number;
    const lng = routeOriginLng as number;
    setStartPoint([lat, lng]);
    setGpsState('ok');
    setGpsError(null);
    gpsCapturedRef.current?.(lat, lng);
  }, [routeOriginLat, routeOriginLng]);

  useEffect(() => {
    captureGps();
  }, [captureGps]);

  // 2. Fetch the real road route (rider GPS -> customer checkout GPS) from OSRM
  const loadRoute = useCallback(
    async (signal?: AbortSignal) => {
      const origin = routeOrigin || startPoint;
      if (!origin || !destination) return;
      setRouteState('loading');
      setRouteError(null);
      try {
        const r = await fetchRoadRoute(origin, destination, signal);
        if (!mountedRef.current || signal?.aborted) return;
        setRoute(r);
        setRouteState('ready');
      } catch (e: any) {
        if (!mountedRef.current || signal?.aborted) return;
        setRoute(null);
        setRouteState('error');
        setRouteError(e?.message || 'Unable to fetch road route.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startPoint, routeOriginLat, routeOriginLng, destinationLat, destinationLng],
  );

  useEffect(() => {
    if ((!routeOrigin && !startPoint) || !destValid) return;
    const controller = new AbortController();
    loadRoute(controller.signal);
    return () => controller.abort();
  }, [startPoint, routeOriginLat, routeOriginLng, destValid, loadRoute]);

  // 3. Leaflet map init
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!mapContainerRef.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled || !mapContainerRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, { zoom: 13, center: [28.4595, 77.0266] });
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
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      riderMarkerRef.current = null;
      routeLineRef.current = null;
      travelledLineRef.current = null;
      destMarkerRef.current = null;
      setMapReady(false);
    };
  }, []);

  // 4. Draw destination + route polyline + rider marker whenever route changes
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    // Clear previous layers
    [routeLineRef, travelledLineRef, riderMarkerRef, destMarkerRef].forEach((ref) => {
      if (ref.current) {
        map.removeLayer(ref.current);
        ref.current = null;
      }
    });

    if (destination) {
      destMarkerRef.current = L.marker(destination, {
        icon: L.divIcon({
          className: '',
          html: HOME_ICON_HTML,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })
        .addTo(map)
        .bindPopup(`<b>${customerName}</b><br/>Customer checkout GPS`);
    }

    if (route) {
      routeLineRef.current = L.polyline(route.coordinates, {
        color: '#D9700F',
        weight: 5,
        opacity: 0.85,
      }).addTo(map);
      travelledLineRef.current = L.polyline([route.coordinates[0]], {
        color: '#6B3A0A',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
      riderMarkerRef.current = L.marker(route.coordinates[0], {
        icon: L.divIcon({
          className: '',
          html: RIDER_ICON_HTML,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        zIndexOffset: 1000,
      }).addTo(map);
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [30, 30] });
    } else if (startPoint) {
      riderMarkerRef.current = L.marker(startPoint, {
        icon: L.divIcon({
          className: '',
          html: RIDER_ICON_HTML,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        zIndexOffset: 1000,
      }).addTo(map);
      if (destination) map.fitBounds(L.latLngBounds([startPoint, destination]), { padding: [40, 40] });
      else map.setView(startPoint, 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, route, startPoint, destinationLat, destinationLng]);

  const moveMarkerTo = useCallback(
    (r: RoadRoute, distance: number) => {
      const { position } = pointAtDistance(r, distance);
      riderMarkerRef.current?.setLatLng(position);
      if (travelledLineRef.current) {
        // vertices already travelled + the interpolated current point (always on a road segment)
        let idx = 0;
        while (idx < r.cumulative.length - 1 && r.cumulative[idx + 1] <= distance) idx++;
        travelledLineRef.current.setLatLngs([...r.coordinates.slice(0, idx + 1), position]);
      }
      return position;
    },
    [],
  );

  const resetToStart = useCallback(() => {
    clearTick();
    setIsSimulating(false);
    setCompleted(false);
    setProgress(0);
    setRemainingMeters(route ? routeLength(route) : null);
    if (route) moveMarkerTo(route, 0);
  }, [clearTick, route, moveMarkerTo]);

  // Stop simulation if the order is no longer live (delivered/cancelled by other flow)
  useEffect(() => {
    if (!['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(orderStatus)) {
      clearTick();
      setIsSimulating(false);
    }
  }, [orderStatus, clearTick]);

  // Start automatically once acceptance has loaded the saved GPS points and OSRM route.
  const startSimulation = async () => {
    if (!route || !startPoint || isSimulating || starting || tickRef.current) return;
    setStartError(null);
    setStarting(true);

    let status = orderStatus;
    if (status === 'ASSIGNED') {
      const ok = await onUpdateStatus(orderId, 'PICKED_UP', 'Demo workflow: rider collected the order after acceptance');
      if (!ok) {
        setStarting(false);
        setStartError('Could not start the rider route. Please retry.');
        return;
      }
      status = 'PICKED_UP';
    }
    if (status === 'PICKED_UP') {
      const ok = await onUpdateStatus(orderId, 'OUT_FOR_DELIVERY', 'Demo workflow: rider is on the way');
      if (!ok) {
        setStarting(false);
        setStartError('Could not start the rider route. Please retry.');
        return;
      }
    }
    if (!mountedRef.current) return;

    const total = routeLength(route);
    const parsedStart = assignedAt ? new Date(assignedAt).getTime() : Date.now();
    const simulationStart = Number.isFinite(parsedStart) ? parsedStart : Date.now();
    const virtualSpeedKmh = Math.round((total / (SIMULATION_DURATION_MS / 1000)) * 3.6);
    lastEmitRef.current = 0;
    completionSentRef.current = false;
    clearTick();
    setStarting(false);
    setCompleted(false);
    setIsSimulating(true);

    const tick = () => {
      if (!mountedRef.current) return;
      const elapsedMs = Math.max(0, Date.now() - simulationStart);
      const fraction = Math.min(1, elapsedMs / SIMULATION_DURATION_MS);
      const travelled = total * fraction;
      const finished = fraction >= 1;
      const remaining = Math.max(0, total - travelled);
      const { heading } = pointAtDistance(route, travelled);
      const position = moveMarkerTo(route, travelled);

      setProgress(Math.round(fraction * 100));
      setRemainingMeters(remaining);

      const now = Date.now();
      if (finished || now - lastEmitRef.current >= EMIT_MS) {
        lastEmitRef.current = now;
        const locationUpdate = {
          latitude: position[0],
          longitude: position[1],
          heading,
          speed: finished ? 0 : virtualSpeedKmh,
          source: 'SIMULATION' as const,
          progress: Math.round(fraction * 1000) / 10,
          remainingMeters: Math.round(remaining),
          stage: finished ? 'REACHED_DESTINATION' : 'ON_THE_WAY',
        };
        emitRef.current(locationUpdate);
        if (!socketStreamReadyRef.current) {
          void api.post('/delivery/location', { ...locationUpdate, orderId }).catch(() => undefined);
        }
      }

      if (finished) {
        clearTick();
        setIsSimulating(false);
        setCompleted(true);
        setProgress(100);
        setRemainingMeters(0);
        if (!completionSentRef.current) {
          completionSentRef.current = true;
          void onUpdateStatus(orderId, 'DELIVERED', 'Demo workflow: virtual rider reached the customer').then((ok) => {
            if (!ok && mountedRef.current) {
              completionSentRef.current = false;
              setStartError('Could not complete the delivery automatically. Please retry.');
            }
          });
        }
      }
    };

    tick();
    if (!completionSentRef.current) tickRef.current = setInterval(tick, TICK_MS);
  };

  const startSimulationRef = useRef(startSimulation);
  startSimulationRef.current = startSimulation;

  const canStart =
    gpsState === 'ok' &&
    routeState === 'ready' &&
    !!route &&
    !isSimulating &&
    !starting &&
    !completed &&
    ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(orderStatus);

  useEffect(() => {
    if (!canStart || autoStartRef.current) return;
    autoStartRef.current = true;
    void startSimulationRef.current();
  }, [canStart, orderId]);

  const statusLabel = completed
    ? 'Reached Destination'
    : isSimulating
    ? 'On The Way (virtual)'
    : orderStatus.replace(/_/g, ' ');
  const parsedStart = assignedAt ? new Date(assignedAt).getTime() : clockNow;
  const etaSeconds = Math.max(
    0,
    Math.ceil((SIMULATION_DURATION_MS - Math.max(0, clockNow - (Number.isFinite(parsedStart) ? parsedStart : clockNow))) / 1000),
  );
  const etaLabel = etaSeconds <= 10 ? 'Arriving Now' : `Reaching in ${Math.max(1, Math.ceil(etaSeconds / 60))} min`;

  return (
    <div className="rounded-2xl border border-[#F0DEC8] bg-[#FFFCF8] p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-[#6B3A0A]">
          <Navigation className="w-4 h-4 text-[#D9700F]" />
          <span>Road Route Simulation · #{orderNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
            {statusLabel}
          </span>
          {isSocketLive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Wifi className="w-2.5 h-2.5" /> Socket Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-[#D9700F] border border-amber-200">
              <WifiOff className="w-2.5 h-2.5" /> Reconnecting
            </span>
          )}
        </div>
      </div>

      {/* Setup checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <div className="p-2.5 rounded-xl bg-white border border-[#F0DEC8] flex items-start gap-2">
          <Compass className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${gpsState === 'ok' ? 'text-emerald-600' : 'text-[#D9700F]'}`} />
          <div>
            <div className="font-black text-[#6B3A0A]">Rider GPS (start)</div>
            {gpsState === 'locating' && <div className="text-[#8C6D53]">Fetching device location...</div>}
            {gpsState === 'ok' && startPoint && (
              <div className="text-emerald-700 font-semibold">
                {startPoint[0].toFixed(5)}°N, {startPoint[1].toFixed(5)}°E
              </div>
            )}
            {gpsState === 'error' && <div className="text-red-600">{gpsError}</div>}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-[#F0DEC8] flex items-start gap-2">
          <Navigation className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${destValid ? 'text-emerald-600' : 'text-red-500'}`} />
          <div>
            <div className="font-black text-[#6B3A0A]">Customer GPS (destination)</div>
            {destValid ? (
              <div className="text-emerald-700 font-semibold">
                {(destinationLat as number).toFixed(5)}°N, {(destinationLng as number).toFixed(5)}°E
              </div>
            ) : (
              <div className="text-red-600">Customer checkout GPS is missing for this order.</div>
            )}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-[#F0DEC8] flex items-start gap-2">
          <Sparkles className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${routeState === 'ready' ? 'text-emerald-600' : 'text-[#D9700F]'}`} />
          <div>
            <div className="font-black text-[#6B3A0A]">OSRM road route</div>
            {routeState === 'idle' && <div className="text-[#8C6D53]">Waiting for rider GPS...</div>}
            {routeState === 'loading' && <div className="text-[#8C6D53]">Fetching road route...</div>}
            {routeState === 'ready' && route && (
              <div className="text-emerald-700 font-semibold">{formatDistance(route.distanceMeters)} by road</div>
            )}
            {routeState === 'error' && <div className="text-red-600">{routeError}</div>}
          </div>
        </div>
      </div>

      {/* Retry actions (no straight-line fallback) */}
      {(gpsState === 'error' || routeState === 'error') && (
        <div className="flex flex-wrap items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          {gpsState === 'error' && (
            <button
              type="button"
              onClick={captureGps}
              className="px-3 py-1.5 bg-white border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Retry GPS
            </button>
          )}
          {gpsState === 'ok' && routeState === 'error' && (
            <button
              type="button"
              onClick={() => loadRoute()}
              className="px-3 py-1.5 bg-white border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Retry Road Route
            </button>
          )}
          <span className="text-[10px] text-[#8C6D53]">
            Simulation is disabled until valid GPS and a real road route are available.
          </span>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="w-full h-64 sm:h-80 rounded-xl border border-[#F0DEC8] overflow-hidden z-0"
      />

      {/* Progress */}
      {(isSimulating || completed) && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#6B3A0A]">
            <span>Route progress: {progress}%</span>
            <span>
              {remainingMeters !== null ? `${formatDistance(remainingMeters)} remaining` : ''}
            </span>
          </div>
          <div className="h-2.5 bg-[#F7E3CF] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D9700F] to-emerald-500 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {completed && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Rider reached the customer's location. Complete the handover below with the customer's PIN.
        </div>
      )}

      {startError && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 font-semibold">
          {startError}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {canStart && (
          <button
            type="button"
            onClick={startSimulation}
            disabled={starting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-70"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{starting ? 'Starting...' : 'Start Demo Tracking'}</span>
          </button>
        )}
        {completed && (
          <button
            type="button"
            onClick={resetToStart}
            className="px-4 py-2.5 bg-white border border-[#D9700F] text-[#D9700F] hover:bg-[#D9700F] hover:text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Demo</span>
          </button>
        )}
        {isSimulating && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#D9700F] animate-pulse">
            <Bike className="w-3.5 h-3.5" /> Virtual rider is driving along the road route...
          </span>
        )}
      </div>

      <p className="text-[10px] text-[#8C6D53] leading-relaxed">
        <b>Demo disclosure:</b> this is a <b>virtual rider simulation</b> that moves along the real OSRM road route
        from the pickup shop to the customer's checkout GPS. It is not real GPS movement. The public OSRM server
        is for demo/testing only.
      </p>
    </div>
  );
}
