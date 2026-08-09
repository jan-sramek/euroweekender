import type { Flight } from '../types/flight';
import { normalizeSearchText } from './citySearch';

function flightSearchBlob(flight: Flight): string {
  return normalizeSearchText(
    [
      flight.cityFrom,
      flight.cityTo,
      flight.cityCodeFrom,
      flight.cityCodeTo,
      flight.countryFrom ?? '',
      flight.countryTo,
      flight.flyFrom,
      flight.flyTo
    ].join(' ')
  );
}

/** Match flights by destination/origin city, country, or IATA (space-separated AND). */
export function filterFlightsByTextQuery(flights: Flight[], query: string): Flight[] {
  const tokens = normalizeSearchText(query)
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return flights;

  return flights.filter(flight => {
    const blob = flightSearchBlob(flight);
    return tokens.every(token => blob.includes(token));
  });
}
