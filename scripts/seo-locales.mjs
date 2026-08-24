/**
 * Locale lists for sitemap + prerender. Keep in sync with
 * flight-search/frontend/src/config/locales.ts
 */
export const LOCALES = [
  'en',
  'de',
  'fr',
  'es',
  'it',
  'pl',
  'nl',
  'ro',
  'tr',
  'pt',
  'cs',
  'hu',
  'el',
  'sv',
  'uk',
  'ru',
  'bg',
  'da',
  'fi',
  'sk',
  'no',
  'lt',
  'lv',
  'et',
  'is'
];

/**
 * Homepage / tools / content pages. City landings use English + the local
 * language instead — see seo-city-locales.mjs.
 * Keep in sync with STATIC_INDEXABLE_LOCALE_CODES in cityIndexLocales.ts.
 */
export const STATIC_INDEXABLE_LOCALES = ['en', 'de', 'fr', 'es', 'it', 'pl', 'nl', 'cs'];
