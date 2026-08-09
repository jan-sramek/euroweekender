import type { City } from '../types/city';

const IATA_SUFFIX = /-([a-z]{3})$/i;

/** ASCII slug for URL path segments (English city name preferred). */
export function slugifyCityName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Build canonical slug: prague-prg. */
export function buildCitySlug(city: Pick<City, 'code' | 'name'>): string {
  const code = city.code.trim().toUpperCase();
  const base = slugifyCityName(city.name) || code.toLowerCase();
  return base + '-' + code.toLowerCase();
}

/** Parse trailing IATA code from a city slug (prague-prg -> PRG). */
export function parseCityCodeFromSlug(slug: string | undefined): string | null {
  if (!slug?.trim()) return null;
  const match = slug.trim().match(IATA_SUFFIX);
  if (match?.[1]) return match[1].toUpperCase();

  // Allow bare IATA: /weekend-flights-from/prg
  if (/^[a-z]{3}$/i.test(slug.trim())) return slug.trim().toUpperCase();
  return null;
}

export function weekendFlightsFromPath(city: Pick<City, 'code' | 'name'>): string {
  return '/weekend-flights-from/' + buildCitySlug(city);
}

export function weekendFlightsFromPathByCode(code: string, name?: string): string {
  const normalized = code.trim().toUpperCase();
  if (name?.trim()) {
    return weekendFlightsFromPath({ code: normalized, name: name.trim() });
  }
  return '/weekend-flights-from/' + normalized.toLowerCase();
}
