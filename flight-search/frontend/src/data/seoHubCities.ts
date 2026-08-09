import hubCities from '../../public/seo-hub-cities.json';

export interface SeoHubCity {
  code: string;
  name: string;
}

export const SEO_HUB_CITIES: SeoHubCity[] = hubCities;

export const SEO_HUB_CODES = new Set(SEO_HUB_CITIES.map(city => city.code.toUpperCase()));
