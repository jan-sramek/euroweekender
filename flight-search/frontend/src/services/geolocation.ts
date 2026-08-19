import { isValidLatLng, type LatLng } from '../utils/geo';

export type GeoPosition = LatLng;

const GEO_TIMEOUT_MS = 10000;
/** Reuse a recent fix so a new tab does not wait on GPS again. */
const GEO_MAX_AGE_MS = 300000;

async function isGeolocationDenied(): Promise<boolean> {
  const permissions = typeof navigator === 'undefined' ? undefined : navigator.permissions;
  if (!permissions?.query) return false;

  try {
    const status = await permissions.query({ name: 'geolocation' });
    return status.state === 'denied';
  } catch {
    return false;
  }
}

/**
 * Browser location (GPS / Wi-Fi / cell). Preferred over IP geolocation.
 */
export async function getCurrentPosition(): Promise<GeoPosition | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  if (await isGeolocationDenied()) {
    return null;
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        resolve(isValidLatLng(coords) ? coords : null);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAX_AGE_MS }
    );
  });
}

/** City-level estimate from the visitor IP. Used only when GPS is unavailable. */
export async function getIpPosition(signal?: AbortSignal): Promise<GeoPosition | null> {
  try {
    const response = await fetch('/api/geo/ip', { signal });
    if (!response.ok || response.status === 204) return null;
    const raw = (await response.json()) as { latitude?: unknown; longitude?: unknown };
    const coords = {
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude)
    };
    return isValidLatLng(coords) ? coords : null;
  } catch {
    return null;
  }
}

/** GPS first, IP second. Null if both fail — do not invent a city. */
export async function resolveUserPosition(): Promise<GeoPosition | null> {
  const ipPromise = getIpPosition();
  const gps = await getCurrentPosition();
  if (gps) return gps;
  return ipPromise;
}
