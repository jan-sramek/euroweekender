import { IMAGES } from '../config/images';

function unsplash(photoId: string, width = 640) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Curated cityscape photos keyed by Tequila city IATA code. IDs must 200 on images.unsplash.com. */
const CITY_PHOTOS: Record<string, string> = {
  AMS: unsplash('1534351590666-13e3e96b5017'),
  BCN: unsplash('1583422409516-2895a77efded'),
  BER: unsplash('1560969184-10fe8719e047'),
  CPH: unsplash('1579126219016-fbc7f8670d6a'),
  FCO: unsplash('1552832230-c0197dd311b5'),
  IST: unsplash('1524231757912-21f4fe3a7200'),
  LIS: unsplash('1555881400-74d7acaacd8b'),
  LON: unsplash('1513635269975-59663e0ac1ad'),
  MLA: unsplash('1685621425871-ff24a376026b'),
  PAR: unsplash('1502602898657-3e91760cbb34'),
  PRG: unsplash('1551882547-ff40c63fe5fa'),
  ROM: unsplash('1552832230-c0197dd311b5'),
  STO: unsplash('1509356843151-3e7d96241e11')
};

/** Wikipedia page titles when the city name is a country, adjective, or ambiguous. */
const WIKI_TITLES: Record<string, string> = {
  ACE: 'Arrecife',
  AGP: 'Málaga',
  CIA: 'Rome',
  FAO: 'Faro, Portugal',
  FCO: 'Rome',
  FUE: 'Puerto del Rosario',
  GVA: 'Geneva',
  IBZ: 'Ibiza',
  KRK: 'Kraków',
  LPA: 'Las Palmas',
  MLA: 'Valletta',
  NCE: 'Nice, France',
  OPO: 'Porto',
  PMI: 'Palma de Mallorca',
  REK: 'Reykjavík',
  ROM: 'Rome',
  TFS: 'Santa Cruz de Tenerife'
};

const CACHE_VERSION = 'v2';

export const FALLBACK_CITY_PHOTO = IMAGES.cityBreak;

export function getCuratedCityPhoto(cityCode: string | undefined): string | null {
  const code = cityCode?.trim().toUpperCase();
  if (!code) return null;
  return CITY_PHOTOS[code] ?? null;
}

export function getFallbackCityPhoto(): string {
  return FALLBACK_CITY_PHOTO;
}

export function wikipediaTitleForCity(cityCode: string, cityName: string): string {
  const override = WIKI_TITLES[cityCode.trim().toUpperCase()];
  return override ?? cityName.trim();
}

export function wikipediaPhotoCacheKey(cityCode: string): string {
  return `ew-city-photo:${CACHE_VERSION}:${cityCode.trim().toUpperCase()}`;
}

export function isUsableWikiPhoto(url: string | undefined): url is string {
  if (!url?.trim()) return false;
  const lower = url.toLowerCase();
  if (lower.includes('.svg')) return false;
  if (lower.includes('flag_of') || lower.includes('coat_of_arms')) return false;
  if (lower.includes('logo') || lower.includes('icon_of')) return false;
  return true;
}

interface WikiSummary {
  type?: string;
  originalimage?: { source?: string };
  thumbnail?: { source?: string };
}

export async function fetchWikipediaCityPhoto(
  cityName: string,
  country: string,
  cityCode = ''
): Promise<string | null> {
  const titles = [
    wikipediaTitleForCity(cityCode, cityName),
    cityName.trim(),
    [cityName.trim(), country.trim()].filter(Boolean).join(', ')
  ].filter((title, index, all) => title.length > 0 && all.indexOf(title) === index);

  for (const title of titles) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) continue;

    const data = (await response.json()) as WikiSummary;
    if (data.type === 'disambiguation') continue;

    const photo = data.originalimage?.source || data.thumbnail?.source;
    if (isUsableWikiPhoto(photo)) return photo.split('?')[0];
  }

  return null;
}
