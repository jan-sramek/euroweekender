import type { City, CityWithDistance, DestinationSuggestCity, HubScore } from '../types/city';
import type { GeoPosition } from './geolocation';
import { computeEffectiveScore, hubScoresByCode } from './hubScore';

const EARTH_RADIUS_KM = 6371;
export const NEARBY_RADIUS_KM = 350;
export const NEARBY_MAX_CITIES = 100;
/** Only auto-select airports within this drive of the anchor (e.g. Ostrava + Katowice). */
export const DEFAULT_SELECTED_RADIUS_KM = 120;
/** Cap on auto-selected origins; usually just the home airport plus a close neighbour. */
export const DEFAULT_SELECTED_CITIES = 3;
/** Empty destination dropdown: cities with the most cheap fares first, then A–Z. */
export const DESTINATION_SUGGEST_MAX_CITIES = 100;

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

/** Pick default departure airports: the anchor plus only very close neighbours. */
export function selectDefaultCityCodes(
  cities: City[],
  hubScores: HubScore[],
  anchorCode: string,
  count = DEFAULT_SELECTED_CITIES
): string[] {
  const anchorCity = findCityByCode(cities, anchorCode);
  if (!anchorCity) return [];

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

/** Nearest city to a GPS or IP fix; undefined when location is missing. */
export function selectAnchorCodeFromPosition(
  cities: City[],
  position: GeoPosition | null | undefined
): string | undefined {
  if (!position) return undefined;
  return rankCitiesByDistance(cities, position, { limit: 1 })[0]?.code.toUpperCase();
}

/** Default origins from a location fix (Ostrava → OSR + Katowice). Empty when unknown. */
export function selectDefaultCityCodesFromPosition(
  cities: City[],
  hubScores: HubScore[],
  position: GeoPosition | null | undefined,
  count = DEFAULT_SELECTED_CITIES
): string[] {
  const anchor = selectAnchorCodeFromPosition(cities, position);
  if (!anchor) return [];
  return selectDefaultCityCodes(cities, hubScores, anchor, count);
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

export interface DestinationSuggestOptions {
  excludeCodes?: string[];
  filter?: (city: City) => boolean;
  limit?: number;
  /** Origin-specific dests ranked by cheap-offer count (live API) or snapshot fallback. */
  originDestinations?: Array<{
    code: string;
    minPrice?: number;
    offerCount?: number;
    cheapOfferCount?: number;
  }>;
  /** Static popular destination codes used when origin dests are missing. */
  popularCodes?: string[];
  nameForSort?: (city: City) => string;
}

function compareDestinationNames(
  a: City,
  b: City,
  nameForSort?: (city: City) => string
): number {
  const left = nameForSort?.(a) ?? a.name;
  const right = nameForSort?.(b) ?? b.name;
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function compareOriginDestinations(
  a: { minPrice?: number; offerCount?: number; cheapOfferCount?: number },
  b: { minPrice?: number; offerCount?: number; cheapOfferCount?: number }
): number {
  const aCheap = a.cheapOfferCount ?? 0;
  const bCheap = b.cheapOfferCount ?? 0;
  if (aCheap !== bCheap) return bCheap - aCheap;
  const aPrice = a.minPrice && a.minPrice > 0 ? a.minPrice : Number.POSITIVE_INFINITY;
  const bPrice = b.minPrice && b.minPrice > 0 ? b.minPrice : Number.POSITIVE_INFINITY;
  if (aPrice !== bPrice) return aPrice - bPrice;
  return (b.offerCount ?? 0) - (a.offerCount ?? 0);
}

/**
 * Empty destination dropdown: cities with the most cheap fares for the origin first,
 * then popular codes, then A–Z.
 * Distance ranking is a poor default here — nearby airports are rarely useful destinations.
 */
export function rankCitiesForDestinationSuggest(
  cities: City[],
  options?: DestinationSuggestOptions
): DestinationSuggestCity[] {
  const exclude = new Set((options?.excludeCodes ?? []).map(code => code.trim().toUpperCase()));
  const limit = options?.limit ?? DESTINATION_SUGGEST_MAX_CITIES;
  const filter = options?.filter;
  const nameForSort = options?.nameForSort;

  const eligible = cities.filter(city => {
    if (exclude.has(city.code.toUpperCase())) return false;
    if (filter && !filter(city)) return false;
    return true;
  });
  const byCode = new Map(eligible.map(city => [city.code.toUpperCase(), city]));

  const priceByCode = new Map<string, number>();
  const originOrdered: City[] = [];
  const originSeen = new Set<string>();

  const originDests = [...(options?.originDestinations ?? [])].sort(compareOriginDestinations);

  for (const dest of originDests) {
    const code = dest.code.trim().toUpperCase();
    const city = byCode.get(code);
    if (!city || originSeen.has(code)) continue;
    originSeen.add(code);
    originOrdered.push(city);
    if (dest.minPrice && dest.minPrice > 0) {
      priceByCode.set(code, dest.minPrice);
    }
  }

  const popularOrdered: City[] = [];
  const popularSeen = new Set(originSeen);
  for (const raw of options?.popularCodes ?? []) {
    const code = raw.trim().toUpperCase();
    const city = byCode.get(code);
    if (!city || popularSeen.has(code)) continue;
    popularSeen.add(code);
    popularOrdered.push(city);
  }

  const rest = eligible
    .filter(city => !popularSeen.has(city.code.toUpperCase()))
    .sort((a, b) => compareDestinationNames(a, b, nameForSort));

  return [...originOrdered, ...popularOrdered, ...rest].slice(0, limit).map(city => ({
    ...city,
    minPrice: priceByCode.get(city.code.toUpperCase()) ?? null
  }));
}
