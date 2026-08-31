import type { City, CitySuggestion, HubScore, OriginDestination } from '../types/city';
import { seoContentKey, type SeoPageContent } from '../utils/seoPageContent';
import type { Flight, FlightPage } from '../types/flight';
import {
  CHEAP_BAND_PAGE_SIZE,
  extraPriceBands,
  maxFlightPrice,
  mergeSearchFlights
} from '../utils/cheapFlightCoverage';
import { withLocalizedName } from '../utils/cityDisplayName';
import { normalizeHubScore, normalizeOriginDestination } from './hubScore';
import { chunkWeekendWindows, getWeekendSearchRange } from './weekend';

const API_BASE = '/api';
const FLIGHTS_PER_CITY = 200;
const MAX_SEARCH_FLIGHTS = 1000;
const MAX_COVERAGE_FLIGHTS = 1600;
/** Single continuous-range request can drown weekend deals in midweek fares. */
const SINGLE_CITY_PAGE_SIZE = 1000;
/** ~1 month of Thu–Mon windows per request so each month keeps its own cheap-flight budget. */
const WEEKEND_SEARCH_CHUNK_SIZE = 4;
const CITIES_CACHE_KEY = 'ew:cities:v5';
const CITIES_CACHE_TTL_MS = 60 * 60 * 1000;
const HUB_SCORES_CACHE_KEY = 'ew:hub-scores:v1';
const HUB_SCORES_CACHE_TTL_MS = 15 * 60 * 1000;
const TOP_DESTINATIONS_CACHE_PREFIX = 'ew:top-destinations:v2:';
const TOP_DESTINATIONS_CACHE_TTL_MS = 15 * 60 * 1000;

function searchPageSize(cityCount: number): number {
  if (cityCount <= 1) return SINGLE_CITY_PAGE_SIZE;
  return Math.min(MAX_SEARCH_FLIGHTS, cityCount * FLIGHTS_PER_CITY);
}

function chunkPageSize(cityCount: number, chunkCount: number): number {
  if (chunkCount <= 1) return searchPageSize(cityCount);
  return Math.min(500, Math.max(150, Math.ceil(MAX_SEARCH_FLIGHTS / chunkCount)));
}

function mergeFlightPages(pages: Flight[][], destinationSearch = false): Flight[] {
  return mergeSearchFlights(pages, MAX_SEARCH_FLIGHTS, MAX_COVERAGE_FLIGHTS, destinationSearch);
}

export interface FlightSearchParams {
  cityCodeFrom: string[];
  cityCodeTo?: string;
  departFromUtc: Date;
  departToUtc: Date;
  nightsInDest?: number;
  page?: number;
  pageSize?: number;
  includeTotal?: boolean;
  priceFrom?: number;
  priceTo?: number;
  signal?: AbortSignal;
}

export interface WeekendFlightSearchWindow {
  departFrom: Date;
  departTo: Date;
}

function normalizeNightsFilters(
  nightsInDest?: number | readonly number[]
): Array<number | undefined> {
  if (nightsInDest == null) return [undefined];
  if (typeof nightsInDest === 'number') return [nightsInDest];
  if (nightsInDest.length === 0) return [undefined];
  return [...new Set(nightsInDest)];
}

export async function searchFlightsForWeekends(
  cityCodeFrom: string[],
  weekends: WeekendFlightSearchWindow[],
  signal?: AbortSignal,
  cityCodeTo?: string,
  nightsInDest?: number | readonly number[],
  onPartial?: (flights: Flight[]) => void
): Promise<Flight[]> {
  if (weekends.length === 0 || cityCodeFrom.length === 0) {
    return [];
  }

  const uniqueCities = [...new Set(cityCodeFrom.map(code => code.trim().toUpperCase()).filter(Boolean))];
  if (uniqueCities.length === 0) return [];

  const chunks = chunkWeekendWindows(weekends, WEEKEND_SEARCH_CHUNK_SIZE);
  if (chunks.length === 0) return [];

  const nightFilters = normalizeNightsFilters(nightsInDest);
  const pageSize = chunkPageSize(uniqueCities.length, chunks.length);
  const destinationSearch = Boolean(cityCodeTo);

  const firstPages = await Promise.all(
    chunks.flatMap(chunk =>
      nightFilters.map(nights =>
        fetchWeekendChunk(uniqueCities, chunk, cityCodeTo, nights, pageSize, signal)
      )
    )
  );

  let merged = mergeFlightPages(firstPages, destinationSearch);
  onPartial?.(merged);

  // Destination queries are already route-filtered. Extra cheap bands (and the
  // cheap-N merge) would drop nearer, pricier weekends in favour of later months.
  if (destinationSearch || merged.length === 0) return merged;

  const bands = extraPriceBands(maxFlightPrice(merged));
  if (bands.length === 0) return merged;

  try {
    const extraPages = await Promise.all(
      chunks.flatMap(chunk =>
        nightFilters.flatMap(nights =>
          bands.map(band =>
            fetchWeekendChunk(
              uniqueCities,
              chunk,
              cityCodeTo,
              nights,
              CHEAP_BAND_PAGE_SIZE,
              signal,
              band.from,
              band.to
            )
          )
        )
      )
    );

    merged = mergeFlightPages([...firstPages, ...extraPages], destinationSearch);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return merged;
  }

  return merged;
}

async function fetchWeekendChunk(
  uniqueCities: string[],
  chunk: WeekendFlightSearchWindow[],
  cityCodeTo: string | undefined,
  nightsInDest: number | undefined,
  pageSize: number,
  signal: AbortSignal | undefined,
  priceFrom?: number,
  priceTo?: number
): Promise<Flight[]> {
  const range = getWeekendSearchRange(chunk);
  if (!range) return [];

  const page = await searchFlights({
    cityCodeFrom: uniqueCities,
    cityCodeTo,
    departFromUtc: range.departFrom,
    departToUtc: range.departTo,
    nightsInDest,
    page: 1,
    pageSize,
    includeTotal: false,
    priceFrom,
    priceTo,
    signal
  });
  return page.items;
}

export async function getCities(): Promise<City[]> {
  const cached = readCitiesCache();
  if (cached) {
    return cached;
  }

  const response = await fetch(`${API_BASE}/cities`);
  if (!response.ok) {
    throw new Error('Failed to load cities');
  }
  const cities = ((await response.json()) as Record<string, unknown>[]).map(normalizeCity);
  writeCitiesCache(cities);
  return cities;
}

const LOCALIZED_NAMES_CACHE_PREFIX = 'ew:city-names:v1:';

export async function getLocalizedCityNames(
  locale: string,
  codes: string[],
  signal?: AbortSignal
): Promise<Record<string, string>> {
  const unique = [...new Set(codes.map(code => code.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return {};

  const merged: Record<string, string> = {};
  const missing: string[] = [];
  for (const code of unique) {
    const cached = readLocalizedNameCache(locale, code);
    if (cached) merged[code] = cached;
    else missing.push(code);
  }

  const chunkSize = 12;
  for (let i = 0; i < missing.length; i += chunkSize) {
    const chunk = missing.slice(i, i + chunkSize);
    const params = new URLSearchParams({
      locale,
      codes: chunk.join(',')
    });
    const response = await fetch(`${API_BASE}/cities/localized-names?${params}`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load localized city names (${response.status})`);
    }
    const payload = (await response.json()) as Record<string, string>;
    for (const [code, name] of Object.entries(payload)) {
      const trimmed = name?.trim();
      if (!trimmed) continue;
      const key = code.trim().toUpperCase();
      merged[key] = trimmed;
      writeLocalizedNameCache(locale, key, trimmed);
    }
  }

  return merged;
}

function localizedNameCacheKey(locale: string, code: string): string {
  return `${LOCALIZED_NAMES_CACHE_PREFIX}${locale}:${code}`;
}

function readLocalizedNameCache(locale: string, code: string): string | null {
  try {
    return sessionStorage.getItem(localizedNameCacheKey(locale, code));
  } catch {
    return null;
  }
}

function writeLocalizedNameCache(locale: string, code: string, name: string): void {
  try {
    sessionStorage.setItem(localizedNameCacheKey(locale, code), name);
  } catch {
    // Ignore quota or private-mode storage errors.
  }
}

export async function suggestCities(
  term: string,
  locale: string,
  signal?: AbortSignal
): Promise<CitySuggestion[]> {
  const query = term.trim();
  if (query.length < 1) return [];

  const params = new URLSearchParams({
    term: query,
    locale,
    limit: '8'
  });

  const response = await fetch(`${API_BASE}/cities/suggest?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to suggest cities (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>[];
  return payload.map(raw => {
    const city = normalizeCity(raw);
    const localizedName = String(raw.localizedName ?? raw.LocalizedName ?? '');
    return {
      ...city,
      localizedName: localizedName || undefined
    };
  });
}

function normalizeCity(raw: Record<string, unknown>): City {
  const namesByLocale = normalizeNamesByLocale(raw.namesByLocale ?? raw.NamesByLocale);
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    code: String(raw.code ?? raw.Code ?? ''),
    name: String(raw.name ?? raw.Name ?? ''),
    country: String(raw.country ?? raw.Country ?? ''),
    region: (raw.region ?? raw.Region ?? null) as string | null,
    continent: String(raw.continent ?? raw.Continent ?? ''),
    latitude: Number(raw.latitude ?? raw.Latitude ?? 0),
    longitude: Number(raw.longitude ?? raw.Longitude ?? 0),
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
    aliases: Array.isArray(raw.aliases ?? raw.Aliases)
      ? ((raw.aliases ?? raw.Aliases) as unknown[]).map(String)
      : [],
    namesByLocale
  };
}

function normalizeNamesByLocale(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, string> = {};
  for (const [locale, name] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof name === 'string' && name.trim()) {
      result[locale] = name.trim();
    }
  }
  return result;
}

/** Persist a newly discovered localized alias into the session cities cache. */
export function rememberCityAlias(code: string, alias: string): void {
  const normalizedAlias = alias.trim();
  if (!normalizedAlias) return;

  const cached = readCitiesCache();
  if (!cached) return;

  let changed = false;
  const next = cached.map(city => {
    if (city.code.toUpperCase() !== code.toUpperCase()) return city;

    const aliases = city.aliases ?? [];
    if (
      aliases.some(existing => existing.toLowerCase() === normalizedAlias.toLowerCase()) ||
      city.name.toLowerCase() === normalizedAlias.toLowerCase()
    ) {
      return city;
    }

    changed = true;
    return { ...city, aliases: [...aliases, normalizedAlias] };
  });

  if (changed) {
    writeCitiesCache(next);
  }
}

/** Persist a locale-specific display name into the session cities cache. */
export function rememberCityLocalizedName(code: string, language: string, localizedName: string): void {
  const cached = readCitiesCache();
  if (!cached) return;

  let changed = false;
  const next = cached.map(city => {
    if (city.code.toUpperCase() !== code.toUpperCase()) return city;
    const updated = withLocalizedName(city, language, localizedName);
    if (updated === city) return city;
    changed = true;
    return updated;
  });

  if (changed) {
    writeCitiesCache(next);
  }
}

/** Replace the in-memory/session cities cache (used after enriching localized names). */
export function replaceCitiesCache(cities: City[]): void {
  writeCitiesCache(cities);
}

function readCitiesCache(): City[] | null {
  try {
    const raw = sessionStorage.getItem(CITIES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { cachedAt: number; cities: City[] };
    if (!Array.isArray(parsed.cities) || typeof parsed.cachedAt !== 'number') {
      return null;
    }

    if (Date.now() - parsed.cachedAt > CITIES_CACHE_TTL_MS) {
      sessionStorage.removeItem(CITIES_CACHE_KEY);
      return null;
    }

    return parsed.cities;
  } catch {
    return null;
  }
}

function writeCitiesCache(cities: City[]): void {
  try {
    sessionStorage.setItem(
      CITIES_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), cities })
    );
  } catch {
    // Ignore quota or private-mode storage errors.
  }
}

export function getCachedHubScores(weeks = 4): HubScore[] | null {
  return readHubScoresCache(weeks);
}

export async function getHubScores(weeks = 4): Promise<HubScore[]> {
  const cached = readHubScoresCache(weeks);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${API_BASE}/cities/hub-scores?weeks=${weeks}`);
  if (!response.ok) {
    throw new Error(`Failed to load hub scores (${response.status})`);
  }
  const payload = (await response.json()) as Record<string, unknown>[];
  const scores = payload.map(normalizeHubScore).filter(score => score.code.length > 0);
  writeHubScoresCache(weeks, scores);
  return scores;
}

function readHubScoresCache(weeks: number): HubScore[] | null {
  try {
    const raw = sessionStorage.getItem(HUB_SCORES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { cachedAt: number; weeks: number; scores: HubScore[] };
    if (
      !Array.isArray(parsed.scores) ||
      typeof parsed.cachedAt !== 'number' ||
      parsed.weeks !== weeks
    ) {
      return null;
    }

    if (Date.now() - parsed.cachedAt > HUB_SCORES_CACHE_TTL_MS) {
      sessionStorage.removeItem(HUB_SCORES_CACHE_KEY);
      return null;
    }

    return parsed.scores;
  } catch {
    return null;
  }
}

function writeHubScoresCache(weeks: number, scores: HubScore[]): void {
  try {
    sessionStorage.setItem(
      HUB_SCORES_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), weeks, scores })
    );
  } catch {
    // Ignore quota or private-mode storage errors.
  }
}

/** Top destinations from an origin, ranked by how many cheap fares they have. */
export async function getTopDestinations(
  code: string,
  weeks = 4,
  limit = 50
): Promise<OriginDestination[]> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return [];

  const cacheKey = `${TOP_DESTINATIONS_CACHE_PREFIX}${normalized}:${weeks}:${limit}`;
  const cached = readTopDestinationsCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(
    `${API_BASE}/cities/${normalized}/top-destinations?weeks=${weeks}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Failed to load top destinations (${response.status})`);
  }
  const payload = (await response.json()) as Record<string, unknown>[];
  const destinations = payload.map(normalizeOriginDestination).filter(d => d.code.length > 0);
  writeTopDestinationsCache(cacheKey, destinations);
  return destinations;
}

function readTopDestinationsCache(cacheKey: string): OriginDestination[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { cachedAt: number; destinations: OriginDestination[] };
    if (!Array.isArray(parsed.destinations) || typeof parsed.cachedAt !== 'number') {
      return null;
    }

    if (Date.now() - parsed.cachedAt > TOP_DESTINATIONS_CACHE_TTL_MS) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.destinations;
  } catch {
    return null;
  }
}

function writeTopDestinationsCache(cacheKey: string, destinations: OriginDestination[]): void {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ cachedAt: Date.now(), destinations }));
  } catch {
    // Ignore quota or private-mode storage errors.
  }
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightPage> {
  const query = new URLSearchParams({
    cityCodeFrom: params.cityCodeFrom.join(','),
    departFromUtc: params.departFromUtc.toISOString(),
    departToUtc: params.departToUtc.toISOString(),
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50),
    includeTotal: String(params.includeTotal ?? false)
  });

  const destination = params.cityCodeTo?.trim().toUpperCase();
  if (destination) {
    query.set('cityCodeTo', destination);
  }

  if (params.nightsInDest !== undefined) {
    query.set('nightsInDest', String(params.nightsInDest));
  }

  if (params.priceFrom !== undefined) {
    query.set('priceFrom', String(params.priceFrom));
  }

  if (params.priceTo !== undefined) {
    query.set('priceTo', String(params.priceTo));
  }

  const response = await fetch(`${API_BASE}/flights?${query}`, { signal: params.signal });
  if (!response.ok) {
    throw new Error('Failed to load flights');
  }
  return response.json() as Promise<FlightPage>;
}

/** Live Kiwi search for morning-out / evening-back day trips (server-capped). */
export async function liveSearchDayTrips(
  cityCodeFrom: string[],
  days: Date[],
  signal?: AbortSignal
): Promise<Flight[]> {
  const cities = [...new Set(cityCodeFrom.map(code => code.trim().toUpperCase()).filter(Boolean))];
  if (cities.length === 0 || days.length === 0) return [];

  const response = await fetch(`${API_BASE}/day-trips/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      cityCodeFrom: cities.slice(0, 3),
      dates: days.slice(0, 8).map(day => {
        const y = day.getFullYear();
        const m = String(day.getMonth() + 1).padStart(2, '0');
        const d = String(day.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      })
    })
  });

  if (!response.ok) {
    throw new Error('Failed to live-search day trips');
  }

  const page = (await response.json()) as FlightPage;
  return page.items ?? [];
}

type SeoPageContentSnapshot = {
  pages?: Record<string, SeoPageContent>;
};

let seoPageContentSnapshotPromise: Promise<Record<string, SeoPageContent>> | null = null;

function loadSeoPageContentSnapshot(): Promise<Record<string, SeoPageContent>> {
  if (!seoPageContentSnapshotPromise) {
    seoPageContentSnapshotPromise = fetch('/seo-page-content.json')
      .then(response => (response.ok ? response.json() : { pages: {} }))
      .then((payload: SeoPageContentSnapshot) => payload.pages ?? {})
      .catch(() => ({}));
  }
  return seoPageContentSnapshotPromise;
}

function normalizeSeoPageContent(raw: SeoPageContent | null | undefined): SeoPageContent | null {
  if (!raw || !Array.isArray(raw.paragraphs) || raw.paragraphs.length === 0) return null;
  return {
    ...raw,
    destinationCode: raw.destinationCode ?? '',
    faq: Array.isArray(raw.faq) ? raw.faq.filter(item => item?.q && item?.a) : [],
    paragraphs: raw.paragraphs.filter(Boolean)
  };
}

export async function getSeoPageContent(
  pageType: string,
  originCode: string,
  destinationCode: string | null | undefined,
  locale: string
): Promise<SeoPageContent | null> {
  const params = new URLSearchParams({
    pageType,
    origin: originCode.trim().toUpperCase(),
    locale: locale.trim().toLowerCase()
  });
  const destination = destinationCode?.trim().toUpperCase();
  if (destination) params.set('destination', destination);

  try {
    const response = await fetch(`${API_BASE}/seo-content?${params}`);
    if (response.ok) {
      const fromApi = normalizeSeoPageContent((await response.json()) as SeoPageContent);
      if (fromApi) return fromApi;
    }
  } catch {
    // Fall through to the static snapshot used by prerender.
  }

  const pages = await loadSeoPageContentSnapshot();
  return normalizeSeoPageContent(pages[seoContentKey(pageType, originCode, destination, locale)] ?? null);
}
