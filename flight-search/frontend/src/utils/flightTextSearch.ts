import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { normalizeSearchText, textMatchesQuery } from './citySearch';

function citySearchBlob(city: City | undefined): string {
  if (!city) return '';
  return [city.name, ...Object.values(city.namesByLocale ?? {}), ...(city.aliases ?? [])].join(' ');
}

function flightSearchBlob(flight: Flight, citiesByCode?: Map<string, City>): string {
  const fromCity = citiesByCode?.get(flight.cityCodeFrom.trim().toUpperCase());
  const toCity = citiesByCode?.get(flight.cityCodeTo.trim().toUpperCase());
  return [
    flight.cityFrom,
    flight.cityTo,
    flight.cityCodeFrom,
    flight.cityCodeTo,
    flight.countryFrom ?? '',
    flight.countryTo,
    flight.flyFrom,
    flight.flyTo,
    citySearchBlob(fromCity),
    citySearchBlob(toCity)
  ].join(' ');
}

/** Match flights by destination/origin city, country, or IATA (space-separated AND). */
export function filterFlightsByTextQuery(
  flights: Flight[],
  query: string,
  citiesByCode?: Map<string, City>
): Flight[] {
  const tokens = normalizeSearchText(query)
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return flights;

  return flights.filter(flight => {
    const blob = flightSearchBlob(flight, citiesByCode);
    return tokens.every(token => textMatchesQuery(blob, token));
  });
}
