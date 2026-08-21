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

export function dayTripsFromPath(city: Pick<City, 'code' | 'name'>): string {
  return '/day-trips-from/' + buildCitySlug(city);
}

export function dayTripsFromPathByCode(code: string, name?: string): string {
  const normalized = code.trim().toUpperCase();
  if (name?.trim()) {
    return dayTripsFromPath({ code: normalized, name: name.trim() });
  }
  return '/day-trips-from/' + normalized.toLowerCase();
}

/** Build canonical OD slug/path: prague-prg-to-barcelona-bcn. */
export function weekendFlightsOdPath(
  from: Pick<City, 'code' | 'name'>,
  to: Pick<City, 'code' | 'name'>
): string {
  return '/weekend-flights/' + buildCitySlug(from) + '-to-' + buildCitySlug(to);
}

/** Parse an OD path segment like "prague-prg-to-barcelona-bcn" into origin/destination codes. */
export function parseOdSlugs(
  segment: string | undefined
): { fromCode: string; toCode: string } | null {
  const trimmed = segment?.trim().toLowerCase();
  if (!trimmed) return null;

  const separatorIndex = trimmed.lastIndexOf('-to-');
  if (separatorIndex <= 0) return null;

  const fromCode = parseCityCodeFromSlug(trimmed.slice(0, separatorIndex));
  const toCode = parseCityCodeFromSlug(trimmed.slice(separatorIndex + '-to-'.length));
  if (!fromCode || !toCode) return null;

  return { fromCode, toCode };
}

/** Append or merge query params onto a site-relative path. */
export function withQuery(path: string, params: Record<string, string | null | undefined>): string {
  const url = new URL(path, 'https://euroweekender.invalid');
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
