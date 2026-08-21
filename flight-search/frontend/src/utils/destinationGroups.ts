import type { Flight } from '../types/flight';
import { getPerPersonPrice } from './flightPrice';

export interface DestinationGroup {
  cityCode: string;
  cityName: string;
  country: string;
  fromCode: string;
  fromCity: string;
  minPrice: number;
  offerCount: number;
  cheapestFlight: Flight;
}

/** One row per destination city, cheapest fare first. */
export function groupFlightsByDestination(flights: Flight[]): DestinationGroup[] {
  const groups = new Map<string, DestinationGroup>();

  for (const flight of flights) {
    const cityCode = flight.cityCodeTo.trim().toUpperCase();
    if (!cityCode) continue;

    const price = getPerPersonPrice(flight);
    const existing = groups.get(cityCode);
    if (!existing) {
      groups.set(cityCode, {
        cityCode,
        cityName: flight.cityTo,
        country: flight.countryTo,
        fromCode: flight.cityCodeFrom,
        fromCity: flight.cityFrom,
        minPrice: price,
        offerCount: 1,
        cheapestFlight: flight
      });
      continue;
    }

    existing.offerCount += 1;
    if (price < existing.minPrice) {
      existing.minPrice = price;
      existing.cityName = flight.cityTo;
      existing.country = flight.countryTo;
      existing.fromCode = flight.cityCodeFrom;
      existing.fromCity = flight.cityFrom;
      existing.cheapestFlight = flight;
    }
  }

  return [...groups.values()].sort((a, b) => {
    if (a.minPrice !== b.minPrice) return a.minPrice - b.minPrice;
    return a.cityName.localeCompare(b.cityName);
  });
}
