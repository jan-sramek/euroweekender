import { coordsFromCity } from '../data/cityCoordinates';
import {
  estimateFlightDurationMinutes,
  formatDurationLabel,
  haversineKm,
  roundDistanceKm,
  type LatLng
} from './geo';

export interface RouteFacts {
  distanceKm: number;
  durationMinutes: number;
  durationLabel: string;
}

export function computeRouteFacts(from: LatLng, to: LatLng): RouteFacts | null {
  const distance = haversineKm(from, to);
  if (!Number.isFinite(distance) || distance < 1) return null;
  const durationMinutes = estimateFlightDurationMinutes(distance);
  return {
    distanceKm: roundDistanceKm(distance),
    durationMinutes,
    durationLabel: formatDurationLabel(durationMinutes)
  };
}

export function computeRouteFactsFromCities(
  from: { code: string; latitude?: number; longitude?: number } | null | undefined,
  to: { code: string; latitude?: number; longitude?: number } | null | undefined
): RouteFacts | null {
  const fromCoords = coordsFromCity(from);
  const toCoords = coordsFromCity(to);
  if (!fromCoords || !toCoords) return null;
  if (from?.code && to?.code && from.code.toUpperCase() === to.code.toUpperCase()) return null;
  return computeRouteFacts(fromCoords, toCoords);
}

export interface HopRange {
  minDurationLabel: string;
  maxDurationLabel: string;
  minMinutes: number;
  maxMinutes: number;
}

export function typicalHopRange(
  from: { code: string; latitude?: number; longitude?: number },
  destinations: Array<{ code: string; latitude?: number; longitude?: number }>
): HopRange | null {
  const fromCoords = coordsFromCity(from);
  if (!fromCoords) return null;

  const minutes: number[] = [];
  for (const dest of destinations) {
    if (dest.code.toUpperCase() === from.code.toUpperCase()) continue;
    const facts = computeRouteFactsFromCities(from, dest);
    if (facts) minutes.push(facts.durationMinutes);
  }

  if (minutes.length === 0) return null;
  const minMinutes = Math.min(...minutes);
  const maxMinutes = Math.max(...minutes);
  return {
    minMinutes,
    maxMinutes,
    minDurationLabel: formatDurationLabel(minMinutes),
    maxDurationLabel: formatDurationLabel(maxMinutes)
  };
}

export function cheapestMonthFromWeekendPrices(
  weekends: Array<{ id: string; departDate: Date }>,
  pricesByWeekendId: Map<string, number | null>
): Date | null {
  const byMonth = new Map<string, { price: number; year: number; month: number }>();

  for (const weekend of weekends) {
    const price = pricesByWeekendId.get(weekend.id);
    if (price == null) continue;
    const year = weekend.departDate.getFullYear();
    const month = weekend.departDate.getMonth();
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const current = byMonth.get(key);
    if (!current || price < current.price) {
      byMonth.set(key, { price, year, month });
    }
  }

  if (byMonth.size === 0) return null;

  let best: { price: number; year: number; month: number } | null = null;
  for (const entry of byMonth.values()) {
    if (
      !best ||
      entry.price < best.price ||
      (entry.price === best.price &&
        (entry.year < best.year || (entry.year === best.year && entry.month < best.month)))
    ) {
      best = entry;
    }
  }

  return best ? new Date(best.year, best.month, 1) : null;
}

export function formatMonthName(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
}
