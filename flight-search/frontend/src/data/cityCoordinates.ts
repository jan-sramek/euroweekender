import coords from '../../public/seo-city-coords.json';
import { isValidLatLng, type LatLng } from '../utils/geo';

const COORDS_BY_CODE = new Map(
  Object.entries(coords as Record<string, number[]>).map(([code, pair]) => [
    code.toUpperCase(),
    { latitude: pair[0], longitude: pair[1] } satisfies LatLng
  ])
);

export function lookupCityCoords(code: string | null | undefined): LatLng | null {
  if (!code) return null;
  const found = COORDS_BY_CODE.get(code.trim().toUpperCase());
  if (!found || !Number.isFinite(found.latitude) || !Number.isFinite(found.longitude)) return null;
  return found;
}

export function coordsFromCity(
  city: { code: string; latitude?: number; longitude?: number } | null | undefined
): LatLng | null {
  if (!city) return null;
  if (isValidLatLng(city)) return { latitude: city.latitude, longitude: city.longitude };
  return lookupCityCoords(city.code);
}
