import type { City, CityWithDistance, HubScore } from '../types/city';
import type { GeoPosition } from './geolocation';
import { computeEffectiveScore, hubScoresByCode } from './hubScore';

const EARTH_RADIUS_KM = 6371;
export const NEARBY_RADIUS_KM = 350;
export const NEARBY_MAX_CITIES = 100;
export const DEFAULT_ANCHOR_CODE = 'PRG';
/** Only auto-select airports within this drive of the anchor (e.g. Ostrava + Katowice). */
export const DEFAULT_SELECTED_RADIUS_KM = 120;
/** Cap on auto-selected origins; usually just the home airport plus a close neighbour. */
export const DEFAULT_SELECTED_CITIES = 3;
/** Empty destination dropdown: European cities closest to the chosen origin. */
export const DESTINATION_SUGGEST_MAX_CITIES = 100;

const DEFAULT_FALLBACK_CODES = ['PRG', 'VIE', 'BER', 'MUC', 'BCN'];

export function findCityByCode(cities: City[], code: string): City | undefined {
  const normalized = code.trim().toUpperCase();
  return cities.find(city => city.code.toUpperCase() === normalized);
}

function takeTopCityCodes(orderedCodes: string[], count = DEFAULT_SELECTED_CITIES): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const code of orderedCodes) {
    const normalized = code.trim().toUpperCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
    if (unique.length >= count) break;
  }

  return unique;
}

function resolveAnchorCity(cities: City[], anchorCode: string): City | undefined {
  return (
    findCityByCode(cities, anchorCode) ??
    DEFAULT_FALLBACK_CODES.map(code => findCityByCode(cities, code)).find(
      (city): city is City => city !== undefined
    )
  );
}

/** Pick default departure airports: the anchor plus only very close neighbours. */
export function selectDefaultCityCodes(
  cities: City[],
  hubScores: HubScore[],
  anchorCode = DEFAULT_ANCHOR_CODE,
  count = DEFAULT_SELECTED_CITIES
): string[] {
  const anchorCity = resolveAnchorCity(cities, anchorCode);

  if (!anchorCity) {
    return cities[0] ? [cities[0].code.toUpperCase()] : [];
  }

  const anchorCodeUpper = anchorCity.code.toUpperCase();
  const close = rankCitiesByDistance(
    cities,
    { latitude: anchorCity.latitude, longitude: anchorCity.longitude },
    {
      limit: NEARBY_MAX_CITIES,
      radiusKm: DEFAULT_SELECTED_RADIUS_KM
    }
  );

  const scores =
    hubScores.length > 0
      ? new Map(hubScores.map(score => [score.code.toUpperCase(), score]))
      : null;

  const withOffers = scores
    ? close.filter(city => {
        if (city.code.toUpperCase() === anchorCodeUpper) return true;
        return (scores.get(city.code.toUpperCase())?.offerCount ?? 0) > 0;
      })
    : close;

  const candidates = withOffers.length > 0 ? withOffers : close;
  // Always keep the anchor first, then nearest remaining airports.
  const ordered = [
    anchorCodeUpper,
    ...candidates
      .map(city => city.code.toUpperCase())
      .filter(code => code !== anchorCodeUpper)
  ];

  return takeTopCityCodes(ordered, count);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Static fallback origin used before hub scores are ready — just the default anchor. */
export function selectFallbackCityCodes(
  cities: City[],
  count = 1
): string[] {
  const anchor = resolveAnchorCity(cities, DEFAULT_ANCHOR_CODE);
  if (anchor) {
    return takeTopCityCodes([anchor.code], count);
  }

  return cities[0] ? [cities[0].code.toUpperCase()] : [];
}

/** Closest cities by haversine distance (for empty-query airport dropdowns). */
export function rankCitiesByDistance(
  cities: City[],
  position: GeoPosition,
  options?: {
    excludeCodes?: string[];
    filter?: (city: City) => boolean;
    limit?: number;
    radiusKm?: number | null;
  }
): CityWithDistance[] {
  const exclude = new Set((options?.excludeCodes ?? []).map(code => code.trim().toUpperCase()));
  const limit = options?.limit ?? NEARBY_MAX_CITIES;
  const radiusKm = options?.radiusKm;
  const filter = options?.filter;

  return cities
    .filter(city => {
      if (exclude.has(city.code.toUpperCase())) return false;
      if (filter && !filter(city)) return false;
      return true;
    })
    .map(city => {
      const distanceKm = haversineKm(
        position.latitude,
        position.longitude,
        city.latitude,
        city.longitude
      );
      return {
        ...city,
        distanceKm,
        hubScore: 0,
        effectiveScore: 0,
        offerCount: 0,
        minPrice: null
      };
    })
    .filter(city => radiusKm == null || city.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function rankNearbyCities(
  cities: City[],
  position: GeoPosition,
  hubScores: HubScore[],
  limit = NEARBY_MAX_CITIES,
  radiusKm = NEARBY_RADIUS_KM
): CityWithDistance[] {
  const scores = hubScoresByCode(hubScores);

  return cities
    .map(city => {
      const distanceKm = haversineKm(
        position.latitude,
        position.longitude,
        city.latitude,
        city.longitude
      );
      const hub = scores.get(city.code.toUpperCase());
      const hubScore = hub?.hubScore ?? 0;
      const effectiveScore = computeEffectiveScore(hubScore, distanceKm);

      return {
        ...city,
        distanceKm,
        hubScore,
        effectiveScore,
        offerCount: hub?.offerCount ?? 0,
        minPrice: hub?.minPrice ?? null
      };
    })
    .filter(city => city.distanceKm <= radiusKm)
    .sort((a, b) => {
      if (b.effectiveScore !== a.effectiveScore) {
        return b.effectiveScore - a.effectiveScore;
      }
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, limit);
}
