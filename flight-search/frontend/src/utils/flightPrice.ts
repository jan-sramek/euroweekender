import type { Flight } from '../types/flight';

export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 9;

/** Per-adult fare from crawled Kiwi data (searched with 1 adult). */
export function getPerPersonPrice(flight: Flight): number {
  if (flight.fareAdults > 0) return flight.fareAdults;
  return flight.price;
}

export function getTripPrice(flight: Flight, passengers: number): number {
  return getPerPersonPrice(flight) * passengers;
}

export function hasEnoughSeats(flight: Flight, passengers: number): boolean {
  if (flight.availabilitySeats == null) return true;
  return flight.availabilitySeats >= passengers;
}

export function formatEur(amount: number): string {
  return `${Math.round(amount)} EUR`;
}
