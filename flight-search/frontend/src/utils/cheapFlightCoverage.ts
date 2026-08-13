import type { Flight } from '../types/flight';
import { getPerPersonPrice } from './flightPrice';

/** Still-cheap ceiling we always try to cover for busy origins like Barcelona. */
export const CHEAP_COVERAGE_EUR = 120;
export const CHEAP_MID_BAND_EUR = 90;
export const CHEAP_BAND_PAGE_SIZE = 400;
const CHEAP_BAND_KEEP = 400;

interface PriceBand {
  from: number;
  to: number;
  limit: number;
}

const KEEP_BANDS: PriceBand[] = [
  { from: 0, to: 60, limit: CHEAP_BAND_KEEP },
  { from: 60, to: CHEAP_MID_BAND_EUR, limit: CHEAP_BAND_KEEP },
  { from: CHEAP_MID_BAND_EUR, to: CHEAP_COVERAGE_EUR, limit: CHEAP_BAND_KEEP }
];

export function extraPriceBands(currentMaxPrice: number): { from: number; to: number }[] {
  if (currentMaxPrice >= CHEAP_COVERAGE_EUR) return [];
  if (currentMaxPrice < CHEAP_MID_BAND_EUR) {
    return [
      { from: currentMaxPrice, to: CHEAP_MID_BAND_EUR },
      { from: CHEAP_MID_BAND_EUR, to: CHEAP_COVERAGE_EUR }
    ];
  }
  return [{ from: currentMaxPrice, to: CHEAP_COVERAGE_EUR }];
}

export function maxFlightPrice(flights: Flight[]): number {
  if (flights.length === 0) return 0;
  return Math.max(...flights.map(getPerPersonPrice));
}

export function mergeFlightsById(pages: Flight[][]): Flight[] {
  const byId = new Map<number | string, Flight>();

  for (const items of pages) {
    for (const flight of items) {
      const key = flight.id;
      const existing = byId.get(key);
      if (!existing || getPerPersonPrice(flight) < getPerPersonPrice(existing)) {
        byId.set(key, flight);
      }
    }
  }

  return [...byId.values()].sort((a, b) => getPerPersonPrice(a) - getPerPersonPrice(b));
}

/**
 * Origin-only search keeps cheap price bands. Destination search must keep every
 * month's results — later cheap weekends would otherwise crowd out nearer dates.
 */
export function mergeSearchFlights(
  pages: Flight[][],
  minKeep: number,
  maxKeep: number,
  destinationSearch = false
): Flight[] {
  const merged = mergeFlightsById(pages);
  if (destinationSearch) return merged;
  return keepCheapCoverage(merged, minKeep, maxKeep);
}

/**
 * Keep cheapest deals, but do not let ultra-cheap routes crowd out €60–€120 tickets.
 */
export function keepCheapCoverage(flights: Flight[], minKeep: number, maxKeep: number): Flight[] {
  const sorted = mergeFlightsById([flights]);
  if (sorted.length <= minKeep && maxFlightPrice(sorted) >= CHEAP_COVERAGE_EUR) {
    return sorted;
  }

  const kept = new Map<number | string, Flight>();

  for (const band of KEEP_BANDS) {
    let taken = 0;
    for (const flight of sorted) {
      if (taken >= band.limit) break;
      const price = getPerPersonPrice(flight);
      if (price <= band.from || price > band.to) continue;
      if (kept.has(flight.id)) continue;
      kept.set(flight.id, flight);
      taken += 1;
    }
  }

  for (const flight of sorted) {
    if (kept.size >= minKeep) break;
    kept.set(flight.id, flight);
  }

  return [...kept.values()]
    .sort((a, b) => getPerPersonPrice(a) - getPerPersonPrice(b))
    .slice(0, maxKeep);
}
