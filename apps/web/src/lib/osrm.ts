// OSRM road routing helpers (public demo server - not guaranteed for production use).
// Routes are real road geometry; there is intentionally NO straight-line fallback.

export type LatLng = [number, number]; // Leaflet order: [latitude, longitude]

export interface RoadRoute {
  /** Road geometry in Leaflet [lat, lng] order. */
  coordinates: LatLng[];
  /** cumulative[i] = metres travelled along the road up to coordinates[i]. */
  cumulative: number[];
  distanceMeters: number;
  durationSeconds: number;
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving/';

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function bearingDegrees(a: LatLng, b: LatLng): number {
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((b[0] * Math.PI) / 180);
  const x =
    Math.cos((a[0] * Math.PI) / 180) * Math.sin((b[0] * Math.PI) / 180) -
    Math.sin((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Fetch the actual driving route from OSRM.
 * Request: {startLng},{startLat};{destLng},{destLat}?overview=full&geometries=geojson
 * Throws on any failure - callers must show an error (no straight-line fallback).
 */
export async function fetchRoadRoute(
  start: LatLng,
  destination: LatLng,
  signal?: AbortSignal,
): Promise<RoadRoute> {
  const url =
    `${OSRM_BASE}${start[1]},${start[0]};${destination[1]},${destination[0]}` +
    `?overview=full&geometries=geojson`;

  // Hard timeout so the UI never hangs on a busy public server.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Road routing service returned HTTP ${res.status}`);
    }
    const json = await res.json();
    const route = json?.routes?.[0];
    if (json?.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
      throw new Error(json?.message || 'No drivable road route found between these points');
    }

    // GeoJSON is [longitude, latitude] -> Leaflet needs [latitude, longitude]
    const coordinates: LatLng[] = (route.geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => [lat, lng] as LatLng,
    );
    if (coordinates.length < 2) {
      throw new Error('Road route is too short to animate');
    }

    const cumulative: number[] = [0];
    for (let i = 1; i < coordinates.length; i++) {
      cumulative.push(cumulative[i - 1] + haversineMeters(coordinates[i - 1], coordinates[i]));
    }

    return {
      coordinates,
      cumulative,
      distanceMeters: typeof route.distance === 'number' ? route.distance : cumulative[cumulative.length - 1],
      durationSeconds: typeof route.duration === 'number' ? route.duration : 0,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Road routing request timed out. Please retry.');
    }
    throw new Error(err?.message || 'Unable to fetch road route');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Total length of the route polyline in metres. */
export function routeLength(route: RoadRoute): number {
  return route.cumulative[route.cumulative.length - 1] || 0;
}

/**
 * Point located `distance` metres along the road polyline.
 * Interpolates only inside a single road segment, so the marker always stays on the road geometry.
 */
export function pointAtDistance(route: RoadRoute, distance: number): { position: LatLng; heading: number } {
  const total = routeLength(route);
  const d = Math.max(0, Math.min(total, distance));
  const { coordinates, cumulative } = route;

  // Binary search for the segment containing d
  let lo = 0;
  let hi = cumulative.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] <= d) lo = mid;
    else hi = mid;
  }

  const segLen = cumulative[hi] - cumulative[lo];
  const t = segLen > 0 ? (d - cumulative[lo]) / segLen : 0;
  const a = coordinates[lo];
  const b = coordinates[hi];
  return {
    position: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    heading: bearingDegrees(a, b),
  };
}

/** Distance along the route (metres) of the polyline vertex-segment point closest to `point`. */
export function distanceAlongRoute(route: RoadRoute, point: LatLng): number {
  const { coordinates, cumulative } = route;
  let best = Infinity;
  let bestDist = 0;
  // Local equirectangular projection is accurate enough for city-scale segments.
  const k = Math.cos((point[0] * Math.PI) / 180);
  for (let i = 0; i < coordinates.length - 1; i++) {
    const ax = coordinates[i][1] * k;
    const ay = coordinates[i][0];
    const bx = coordinates[i + 1][1] * k;
    const by = coordinates[i + 1][0];
    const px = point[1] * k;
    const py = point[0];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    const cx = ax + dx * t;
    const cy = ay + dy * t;
    const dist2 = (px - cx) ** 2 + (py - cy) ** 2;
    if (dist2 < best) {
      best = dist2;
      bestDist = cumulative[i] + (cumulative[i + 1] - cumulative[i]) * t;
    }
  }
  return bestDist;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '--';
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}
