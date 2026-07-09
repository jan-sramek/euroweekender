import type { City, CityWithDistance, HubScore } from '../types/city';
import type { GeoPosition } from './geolocation';
import { computeEffectiveScore, hubScoresByCode } from './hubScore';

const EARTH_RADIUS_KM = 6371;
export const NEARBY_RADIUS_KM = 350;
export const NEARBY_MAX_CITIES = 40;
export const POPULAR_HUB_MAX_CITIES = 5;
export const POPULAR_HUB_MAX_RADIUS_KM = 1000;
export const MIN_POPULAR_HUB_OFFER_COUNT = 50;
export const DEFAULT_ANCHOR_CODE = 'PRG';
export const DEFAULT_SELECTED_CITIES = 5;

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

/** Pick default departure airports around the primary anchor city (Prague by default). */
export function selectDefaultCityCodes(
  cities: City[],
  hubScores: HubScore[],
  anchorCode = DEFAULT_ANCHOR_CODE,
  count = DEFAULT_SELECTED_CITIES
): string[] {
  const anchorCity =
    findCityByCode(cities, anchorCode) ??
    DEFAULT_FALLBACK_CODES.map(code => findCityByCode(cities, code)).find((city): city is City => city !== undefined);

  if (!anchorCity) {
    return cities[0] ? [cities[0].code.toUpperCase()] : [];
  }

  const nearby = rankNearbyCities(
    cities,
    { latitude: anchorCity.latitude, longitude: anchorCity.longitude },
    hubScores,
    count
  );
  const nearbyCodes = nearby.map(city => city.code);
  if (nearbyCodes.length >= count) {
    return takeTopCityCodes(nearbyCodes, count);
  }

  const fallbackCodes = DEFAULT_FALLBACK_CODES
    .map(code => findCityByCode(cities, code)?.code)
    .filter((code): code is string => Boolean(code));

  return takeTopCityCodes([...nearbyCodes, ...fallbackCodes], count);
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

/** Major hubs outside the nearby picker, ranked by weekend flight offer count. */
export function rankPopularHubCities(
  cities: City[],
  position: GeoPosition,
  hubScores: HubScore[],
  nearbyCities: CityWithDistance[],
  limit = POPULAR_HUB_MAX_CITIES,
  minOfferCount = MIN_POPULAR_HUB_OFFER_COUNT,
  maxRadiusKm = POPULAR_HUB_MAX_RADIUS_KM
): CityWithDistance[] {
  const scores = hubScoresByCode(hubScores);
  const nearbyCodes = new Set(nearbyCities.map(city => city.code.toUpperCase()));

  return cities
    .filter(city => !nearbyCodes.has(city.code.toUpperCase()))
    .map(city => {
      const distanceKm = haversineKm(
        position.latitude,
        position.longitude,
        city.latitude,
        city.longitude
      );
      const hub = scores.get(city.code.toUpperCase());
      const hubScore = hub?.hubScore ?? 0;
      const offerCount = hub?.offerCount ?? 0;

      return {
        ...city,
        distanceKm,
        hubScore,
        effectiveScore: computeEffectiveScore(hubScore, distanceKm),
        offerCount,
        minPrice: hub?.minPrice ?? null
      };
    })
    .filter(city => city.offerCount >= minOfferCount)
    .filter(city => city.distanceKm <= maxRadiusKm)
    .sort((a, b) => {
      if (b.offerCount !== a.offerCount) {
        return b.offerCount - a.offerCount;
      }
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, limit);
}
