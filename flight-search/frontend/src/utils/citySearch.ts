import type { City } from '../types/city';

/** Fold diacritics so "munchen" matches "München". */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/**
 * True when `query` matches `haystack`, including local spellings that only add
 * a short suffix ("milano" → "milan").
 */
export function textMatchesQuery(haystack: string, query: string): boolean {
  const hay = normalizeSearchText(haystack);
  const q = normalizeSearchText(query.trim());
  if (!q) return false;
  if (hay.includes(q)) return true;

  return hay.split(/[^a-z0-9]+/).some(
    word => word.length >= 4 && q.startsWith(word) && q.length <= word.length + 2
  );
}

export function cityMatchesQuery(city: City & { localizedName?: string }, query: string): boolean {
  const q = query.trim();
  if (!q) return false;

  if (textMatchesQuery(city.code, q)) return true;
  if (textMatchesQuery(city.name, q)) return true;
  if (city.localizedName && textMatchesQuery(city.localizedName, q)) return true;
  if (textMatchesQuery(city.country, q)) return true;

  return (city.aliases ?? []).some(alias => textMatchesQuery(alias, q));
}

/** Prefer IATA / name prefix matches, then shorter names. */
export function rankCityMatch(city: City & { localizedName?: string }, query: string): number {
  const q = normalizeSearchText(query.trim());
  const code = normalizeSearchText(city.code);
  const name = normalizeSearchText(city.name);
  const localized = city.localizedName ? normalizeSearchText(city.localizedName) : '';

  if (code === q) return 0;
  if (code.startsWith(q)) return 1;
  if (localized && localized === q) return 1;
  if (name.startsWith(q)) return 2;
  if (localized && localized.startsWith(q)) return 2;
  if ((city.aliases ?? []).some(alias => normalizeSearchText(alias).startsWith(q))) return 3;
  if (localized && localized.includes(q)) return 4;
  if (name.includes(q)) return 4;
  return 5;
}
