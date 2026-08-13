import type { City } from '../types/city';
import { toTequilaLocale } from './tequilaLocale';

/** Prefer the city name in the active UI language when available. */
export function getCityDisplayName(
  city: Pick<City, 'name' | 'namesByLocale'> & { localizedName?: string },
  language: string | undefined
): string {
  const fromMap = lookupLocalizedName(city.namesByLocale, language);
  if (fromMap) return fromMap;
  if (city.localizedName?.trim()) return city.localizedName.trim();
  return city.name;
}

function lookupLocalizedName(
  byLocale: Record<string, string> | undefined,
  language: string | undefined
): string | undefined {
  if (!byLocale) return undefined;

  const tequilaLocale = toTequilaLocale(language);
  const exact = byLocale[tequilaLocale] ?? byLocale[tequilaLocale.toLowerCase()];
  if (exact?.trim()) return exact.trim();

  const base = (language ?? 'en').toLowerCase().split('-')[0] ?? 'en';
  const fuzzy = Object.entries(byLocale).find(([locale]) => {
    const key = locale.toLowerCase();
    return key === base || key.startsWith(`${base}-`);
  });
  return fuzzy?.[1]?.trim() || undefined;
}

export function applyLocalizedNames(
  cities: City[],
  namesByCode: Record<string, string>,
  language: string
): City[] {
  const byCode = new Map<string, string>();
  for (const [code, name] of Object.entries(namesByCode)) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    byCode.set(code.trim().toUpperCase(), trimmed);
  }
  if (byCode.size === 0) return cities;

  let changed = false;
  const next = cities.map(city => {
    const localized = byCode.get(city.code.toUpperCase());
    if (!localized) return city;
    if (getCityDisplayName(city, language) === localized) return city;
    changed = true;
    return withLocalizedName(city, language, localized);
  });
  return changed ? next : cities;
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
