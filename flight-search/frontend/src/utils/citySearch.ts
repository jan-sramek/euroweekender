import type { City } from '../types/city';

/** Fold diacritics so "munchen" matches "München". */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function cityMatchesQuery(city: City & { localizedName?: string }, query: string): boolean {
  const q = normalizeSearchText(query.trim());
  if (!q) return false;

  if (normalizeSearchText(city.code).includes(q)) return true;
  if (normalizeSearchText(city.name).includes(q)) return true;
  if (city.localizedName && normalizeSearchText(city.localizedName).includes(q)) return true;
  if (normalizeSearchText(city.country).includes(q)) return true;

  return (city.aliases ?? []).some(alias => normalizeSearchText(alias).includes(q));
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
