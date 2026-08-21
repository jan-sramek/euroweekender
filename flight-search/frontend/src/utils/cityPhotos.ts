import { IMAGES } from '../config/images';

function unsplash(photoId: string, width = 640) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Curated cityscape photos keyed by Tequila city IATA code. */
const CITY_PHOTOS: Record<string, string> = {
  AMS: unsplash('1534351590666-13e3e96b5017'),
  ATH: unsplash('1555993539-01211fe16b17'),
  BCN: unsplash('1583422409516-2895a77efded'),
  BER: unsplash('1560969184-10fe8719e047'),
  BUD: unsplash('1541343672885-9be56228564b'),
  CPH: unsplash('1513628195603-e407618327d4'),
  DUB: unsplash('1549918864-48ce0c19cbf1'),
  EDI: unsplash('1506377249807-8c16d0b17977'),
  IST: unsplash('1524231757912-21f4fe3a7200'),
  LIS: unsplash('1555881400-74d7acaacd8b'),
  LON: unsplash('1513635269975-59663e0ac1ad'),
  MAD: unsplash('1539037116277-4afd29ba1f7c0'),
  MIL: unsplash('1513581168082-2adf65d8692c'),
  NCE: unsplash('1533105079780-fdcd5f5d1e1b'),
  PAR: unsplash('1502602898657-3e91760cbb34'),
  PMI: unsplash('1533106418989-88806c4facfb'),
  PRG: unsplash('1551882547-ff40c63fe5fa'),
  FCO: unsplash('1502920917128-1aa500764cbd'),
  ROM: unsplash('1502920917128-1aa500764cbd'),
  STO: unsplash('1509356843151-3e7d96281d0b'),
  VCE: unsplash('1523906834658-6dcfd4c3a64b'),
  VIE: unsplash('1609851638187-8b4f15de1eb0')
};

export const FALLBACK_CITY_PHOTO = IMAGES.cityBreak;

export function getCuratedCityPhoto(cityCode: string | undefined): string | null {
  const code = cityCode?.trim().toUpperCase();
  if (!code) return null;
  return CITY_PHOTOS[code] ?? null;
}

export function getFallbackCityPhoto(): string {
  return FALLBACK_CITY_PHOTO;
}

export function wikipediaPhotoCacheKey(cityCode: string): string {
  return `ew-city-photo:${cityCode.trim().toUpperCase()}`;
}

interface WikiQueryResponse {
  query?: {
    pages?: Record<string, { thumbnail?: { source?: string } }>;
  };
}

export async function fetchWikipediaCityPhoto(
  cityName: string,
  country: string
): Promise<string | null> {
  const search = [cityName.trim(), country.trim()].filter(Boolean).join(' ');
  if (!search) return null;

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '640',
    generator: 'search',
    gsrsearch: search,
    gsrlimit: '1'
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
  if (!response.ok) return null;

  const data = (await response.json()) as WikiQueryResponse;
  const pages = data.query?.pages;
  if (!pages) return null;

  const first = Object.values(pages)[0];
  const source = first?.thumbnail?.source?.trim();
  return source || null;
}
