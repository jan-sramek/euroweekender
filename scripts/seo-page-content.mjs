/**
 * Shared helpers for pre-generated programmatic SEO copy.
 * Keep in sync with flight-search/frontend/src/utils/seoPageContent.ts
 */
export const SEO_PAGE_TYPES = {
  weekendFrom: 'weekend-from',
  dayTripsFrom: 'day-trips-from',
  weekendOd: 'weekend-od'
};

export function seoContentKey(pageType, origin, destination, locale) {
  const type = String(pageType || '')
    .trim()
    .toLowerCase();
  const from = String(origin || '')
    .trim()
    .toUpperCase();
  const to = String(destination || '')
    .trim()
    .toUpperCase();
  const lang = String(locale || '')
    .trim()
    .toLowerCase();
  return to ? `${type}:${from}:${to}:${lang}` : `${type}:${from}:${lang}`;
}

export function lookupSeoPageContent(snapshot, pageType, origin, destination, locale) {
  const pages = snapshot?.pages;
  if (!pages || typeof pages !== 'object') return null;
  return pages[seoContentKey(pageType, origin, destination, locale)] ?? null;
}
