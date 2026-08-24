import { SEO_HUB_CITIES } from '../data/seoHubCities';
import { isLocaleCode, type LocaleCode } from './locales';

/**
 * Locales indexed for homepage / tools / content pages (not tied to one city).
 * Keep in sync with STATIC_INDEXABLE_LOCALES in scripts/seo-locales.mjs.
 */
export const STATIC_INDEXABLE_LOCALE_CODES = [
  'en',
  'de',
  'fr',
  'es',
  'it',
  'pl',
  'nl',
  'cs'
] as const satisfies readonly LocaleCode[];

export type StaticIndexableLocaleCode = (typeof STATIC_INDEXABLE_LOCALE_CODES)[number];

/** ISO country → UI locales we can actually serve (English is always added separately). */
const COUNTRY_LOCAL_LOCALES: Record<string, LocaleCode[]> = {
  AT: ['de'],
  BE: ['fr', 'nl'],
  BG: ['bg'],
  CH: ['de', 'fr', 'it'],
  CZ: ['cs'],
  DE: ['de'],
  DK: ['da'],
  EE: ['et'],
  ES: ['es'],
  FI: ['fi'],
  FR: ['fr'],
  GB: [],
  GR: ['el'],
  HU: ['hu'],
  IE: [],
  IS: ['is'],
  IT: ['it'],
  LT: ['lt'],
  LU: ['fr', 'de'],
  LV: ['lv'],
  MD: ['ro'],
  NL: ['nl'],
  NO: ['no'],
  PL: ['pl'],
  PT: ['pt'],
  RO: ['ro'],
  SE: ['sv'],
  SK: ['sk'],
  TR: ['tr'],
  UA: ['uk']
};

/** City-level overrides where the local language differs from the country default. */
const CITY_LOCAL_LOCALE_OVERRIDES: Record<string, LocaleCode[]> = {
  BSL: ['de', 'fr'],
  CRL: ['fr'],
  GVA: ['fr'],
  ZRH: ['de']
};

const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  albania: 'AL',
  austria: 'AT',
  belgium: 'BE',
  bulgaria: 'BG',
  croatia: 'HR',
  czechia: 'CZ',
  'czech republic': 'CZ',
  denmark: 'DK',
  estonia: 'EE',
  finland: 'FI',
  france: 'FR',
  germany: 'DE',
  greece: 'GR',
  hungary: 'HU',
  iceland: 'IS',
  ireland: 'IE',
  italy: 'IT',
  latvia: 'LV',
  lithuania: 'LT',
  luxembourg: 'LU',
  moldova: 'MD',
  netherlands: 'NL',
  'north macedonia': 'MK',
  norway: 'NO',
  poland: 'PL',
  portugal: 'PT',
  romania: 'RO',
  serbia: 'RS',
  slovakia: 'SK',
  slovenia: 'SI',
  spain: 'ES',
  sweden: 'SE',
  switzerland: 'CH',
  turkey: 'TR',
  türkiye: 'TR',
  ukraine: 'UA',
  'united kingdom': 'GB',
  'great britain': 'GB'
};

const HUB_COUNTRY_BY_CODE = new Map(
  SEO_HUB_CITIES.filter(city => city.country).map(city => [
    city.code.toUpperCase(),
    city.country as string
  ])
);

export function isStaticIndexableLocale(value: string | undefined): boolean {
  return STATIC_INDEXABLE_LOCALE_CODES.includes(value as StaticIndexableLocaleCode);
}

function resolveCountryCode(iataCode?: string | null, countryHint?: string | null): string | undefined {
  const code = iataCode?.trim().toUpperCase();
  if (code) {
    const fromHub = HUB_COUNTRY_BY_CODE.get(code);
    if (fromHub) return fromHub;
  }

  const hint = countryHint?.trim();
  if (!hint) return undefined;
  if (/^[A-Za-z]{2}$/.test(hint)) return hint.toUpperCase();
  return COUNTRY_NAME_TO_ISO[hint.toLowerCase()];
}

function uniqueLocales(codes: string[]): LocaleCode[] {
  const seen = new Set<LocaleCode>();
  const ordered: LocaleCode[] = [];
  for (const code of codes) {
    if (!isLocaleCode(code) || seen.has(code)) continue;
    seen.add(code);
    ordered.push(code);
  }
  return ordered;
}

/**
 * City origin/OD landings: English plus the language(s) spoken in that city.
 * Unknown / unsupported local languages fall back to English only.
 */
export function indexableLocalesForOrigin(
  iataCode?: string | null,
  countryHint?: string | null
): LocaleCode[] {
  const code = iataCode?.trim().toUpperCase();
  const override = code ? CITY_LOCAL_LOCALE_OVERRIDES[code] : undefined;
  const country = resolveCountryCode(iataCode, countryHint);
  const local = override ?? (country ? COUNTRY_LOCAL_LOCALES[country] : undefined) ?? [];
  return uniqueLocales(['en', ...local]);
}

/**
 * Locale to use in internal SEO links to a city origin page.
 * Keeps the current UI language when that URL is indexed; otherwise the
 * local language, then English.
 */
export function preferredIndexableLocale(
  current: LocaleCode,
  iataCode?: string | null,
  countryHint?: string | null
): LocaleCode {
  const allowed = indexableLocalesForOrigin(iataCode, countryHint);
  if (allowed.includes(current)) return current;
  return allowed.find(code => code !== 'en') ?? 'en';
}
