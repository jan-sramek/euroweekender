import popularDestinations from '../../public/seo-popular-destinations.json';
import { SEO_HUB_CITIES, type SeoHubCity } from './seoHubCities';

export interface SeoRoutePair {
  from: SeoHubCity;
  to: SeoHubCity;
}

const DEST_BY_CODE = new Map(
  (popularDestinations as SeoHubCity[]).map(city => [city.code.toUpperCase(), city])
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
