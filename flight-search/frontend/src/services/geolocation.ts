import { isValidLatLng, type LatLng } from '../utils/geo';

export type GeoPosition = LatLng;

const GEO_TIMEOUT_MS = 10000;
/** Prefer a fast IP fix over waiting the full GPS timeout for airport chips. */
const GEO_PREFER_IP_AFTER_MS = 2500;
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

function delay(ms: number): Promise<null> {
  return new Promise(resolve => {
    setTimeout(() => resolve(null), ms);
  });
}

/**
 * GPS first when it answers quickly; otherwise IP so airport chips are not stuck
 * behind a full GPS timeout. Still upgrades to GPS if it arrives before IP.
 */
export async function resolveUserPosition(): Promise<GeoPosition | null> {
  const ipPromise = getIpPosition();
  const gpsPromise = getCurrentPosition();

  const quickGps = await Promise.race([gpsPromise, delay(GEO_PREFER_IP_AFTER_MS)]);
  if (quickGps) return quickGps;

  const ip = await ipPromise;
  if (ip) return ip;

  return gpsPromise;
}
