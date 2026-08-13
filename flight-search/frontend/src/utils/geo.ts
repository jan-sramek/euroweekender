const EARTH_RADIUS_KM = 6371;
const CRUISE_KMH = 780;
const BLOCK_OVERHEAD_MINUTES = 40;
const MIN_DURATION_MINUTES = 45;

export interface LatLng {
  latitude: number;
  longitude: number;
}

export function isValidLatLng(value: Partial<LatLng> | null | undefined): value is LatLng {
  return (
    value != null &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    !(value.latitude === 0 && value.longitude === 0)
  );
}

export function haversineKm(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Block time estimate for a typical European short-haul hop (cruise + taxi/climb/descent). */
export function estimateFlightDurationMinutes(distanceKm: number): number {
  const cruiseMinutes = (distanceKm / CRUISE_KMH) * 60;
  const total = cruiseMinutes + BLOCK_OVERHEAD_MINUTES;
  return Math.max(MIN_DURATION_MINUTES, Math.round(total / 5) * 5);
}

export function roundDistanceKm(distanceKm: number): number {
  if (distanceKm < 100) return Math.max(1, Math.round(distanceKm / 5) * 5);
  return Math.round(distanceKm / 10) * 10;
}

/** Compact label used inside translated sentences, e.g. "1h 50min". */
export function formatDurationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}
