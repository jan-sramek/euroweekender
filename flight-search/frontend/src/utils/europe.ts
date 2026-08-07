import type { City } from '../types/city';

/** Kiwi stores continent names (e.g. "Europe"); some fixtures use "EU". */
export function isEuropeanCity(city: City): boolean {
  const continent = city.continent.trim().toLowerCase();
  return continent === 'eu' || continent === 'europe' || continent.startsWith('europe');
}
