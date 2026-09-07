import popularDestinations from '../../public/seo-popular-destinations.json';
import { weekendFlightsOdPath } from '../utils/citySlug';
import { SEO_HUB_CITIES, type SeoHubCity } from './seoHubCities';

export interface SeoRoutePair {
  from: SeoHubCity;
  to: SeoHubCity;
}

export const SEO_POPULAR_DESTINATIONS: SeoHubCity[] = popularDestinations as SeoHubCity[];

/** Keep in sync with prerender-seo.mjs and generate-seo-sitemap.mjs. */
export const SEO_OD_HUB_LIMIT = 40;
export const SEO_OD_DESTINATION_LIMIT = 12;

const SEO_OD_HUB_CODES = new Set(
  SEO_HUB_CITIES.slice(0, SEO_OD_HUB_LIMIT).map(city => city.code.toUpperCase())
);
const SEO_OD_DEST_CODES = new Set(
  SEO_POPULAR_DESTINATIONS.slice(0, SEO_OD_DESTINATION_LIMIT).map(city => city.code.toUpperCase())
);

/** True when this pair has a prerendered /weekend-flights/{from}-to-{to} landing. */
export function isPrerenderedOdPair(fromCode: string, toCode: string): boolean {
  const from = fromCode.trim().toUpperCase();
  const to = toCode.trim().toUpperCase();
  return Boolean(from && to && from !== to && SEO_OD_HUB_CODES.has(from) && SEO_OD_DEST_CODES.has(to));
}

/** SEO OD path when prerendered; otherwise the compare-weekends tool with from/to. */
export function weekendComparePath(
  from: Pick<SeoHubCity, 'code' | 'name'>,
  to: Pick<SeoHubCity, 'code' | 'name'>
): string {
  if (isPrerenderedOdPair(from.code, to.code)) {
    return weekendFlightsOdPath(from, to);
  }
  const fromCode = from.code.trim().toUpperCase();
  const toCode = to.code.trim().toUpperCase();
  return `/cheapest-weekend?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`;
}

const DEST_BY_CODE = new Map(
  SEO_POPULAR_DESTINATIONS.map(city => [city.code.toUpperCase(), city])
);

const HUB_BY_CODE = new Map(SEO_HUB_CITIES.map(city => [city.code.toUpperCase(), city]));

/** High-intent OD pairs featured on the homepage for internal linking. */
const ROUTE_CODES: Array<[string, string]> = [
  ['PRG', 'ROM'],
  ['PRG', 'BCN'],
  ['PRG', 'LON'],
  ['PRG', 'MIL'],
  ['PRG', 'PAR'],
  ['VIE', 'ROM'],
  ['VIE', 'BCN'],
  ['VIE', 'LON'],
  ['VIE', 'MIL'],
  ['BER', 'LON'],
  ['BER', 'ROM'],
  ['BER', 'BCN'],
  ['BER', 'AMS'],
  ['MUC', 'ROM'],
  ['MUC', 'BCN'],
  ['MUC', 'LON'],
  ['LON', 'BCN'],
  ['LON', 'ROM'],
  ['LON', 'AMS'],
  ['LON', 'PAR'],
  ['AMS', 'BCN'],
  ['AMS', 'ROM'],
  ['BCN', 'ROM'],
  ['BCN', 'LON']
];

function resolveCity(code: string): SeoHubCity | undefined {
  const upper = code.toUpperCase();
  return HUB_BY_CODE.get(upper) ?? DEST_BY_CODE.get(upper);
}

export const SEO_POPULAR_ROUTES: SeoRoutePair[] = ROUTE_CODES.flatMap(([fromCode, toCode]) => {
  const from = resolveCity(fromCode);
  const to = resolveCity(toCode);
  if (!from || !to || from.code.toUpperCase() === to.code.toUpperCase()) return [];
  return [{ from, to }];
});
