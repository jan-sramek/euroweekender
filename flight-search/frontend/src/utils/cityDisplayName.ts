import type { City } from '../types/city';
import { toTequilaLocale } from './tequilaLocale';

/** Prefer the city name in the active UI language when available. */
export function getCityDisplayName(
  city: Pick<City, 'name' | 'namesByLocale'> & { localizedName?: string },
  language: string | undefined
): string {
  const tequilaLocale = toTequilaLocale(language);
  const byLocale = city.namesByLocale;

  if (byLocale) {
    const exact = byLocale[tequilaLocale];
    if (exact?.trim()) return exact.trim();

    const base = (language ?? 'en').toLowerCase().split('-')[0] ?? 'en';
    const fuzzy = Object.entries(byLocale).find(([locale]) =>
      locale.toLowerCase().startsWith(`${base}-`)
    );
    if (fuzzy?.[1]?.trim()) return fuzzy[1].trim();
  }

  if (city.localizedName?.trim()) return city.localizedName.trim();
  return city.name;
}

export function indexCitiesByCode(cities: City[]): Map<string, City> {
  const map = new Map<string, City>();
  for (const city of cities) {
    const code = city.code.trim().toUpperCase();
    if (code) map.set(code, city);
  }
  return map;
}

/** Localized city name for an IATA code, or `fallback` when the city is unknown. */
export function getCityNameByCode(
  citiesByCode: Map<string, City> | undefined,
  code: string | undefined,
  language: string | undefined,
  fallback = ''
): string {
  const key = code?.trim().toUpperCase();
  if (!key) return fallback;
  const city = citiesByCode?.get(key);
  return city ? getCityDisplayName(city, language) : fallback;
}

export function withLocalizedName(
  city: City,
  language: string | undefined,
  localizedName: string
): City {
  const tequilaLocale = toTequilaLocale(language);
  const trimmed = localizedName.trim();
  if (!trimmed) return city;

  return {
    ...city,
    namesByLocale: {
      ...(city.namesByLocale ?? {}),
      [tequilaLocale]: trimmed
    }
  };
}
