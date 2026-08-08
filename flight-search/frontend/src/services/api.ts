import type { City, CitySuggestion, HubScore } from '../types/city';
import type { Flight, FlightPage } from '../types/flight';
import { withLocalizedName } from '../utils/cityDisplayName';
import { normalizeHubScore } from './hubScore';
import { getWeekendSearchRange } from './weekend';

const API_BASE = '/api';
const FLIGHTS_PER_CITY = 200;
const MAX_SEARCH_FLIGHTS = 1000;
const SINGLE_CITY_PAGE_SIZE = 500;
const CITIES_CACHE_KEY = 'ew:cities:v4';
const CITIES_CACHE_TTL_MS = 60 * 60 * 1000;
const HUB_SCORES_CACHE_KEY = 'ew:hub-scores:v1';
const HUB_SCORES_CACHE_TTL_MS = 15 * 60 * 1000;

function searchPageSize(cityCount: number): number {
  if (cityCount <= 1) return SINGLE_CITY_PAGE_SIZE;
  return Math.min(MAX_SEARCH_FLIGHTS, cityCount * FLIGHTS_PER_CITY);
}

export interface FlightSearchParams {
  cityCodeFrom: string[];
  cityCodeTo?: string;
  departFromUtc: Date;
  departToUtc: Date;
  page?: number;
  pageSize?: number;
  includeTotal?: boolean;
  signal?: AbortSignal;
}

export interface WeekendFlightSearchWindow {
  departFrom: Date;
  departTo: Date;
}

export async function searchFlightsForWeekends(
  cityCodeFrom: string[],
  weekends: WeekendFlightSearchWindow[],
  signal?: AbortSignal,
  cityCodeTo?: string
): Promise<Flight[]> {
  if (weekends.length === 0 || cityCodeFrom.length === 0) {
    return [];
  }

  const range = getWeekendSearchRange(weekends);
  if (!range) return [];

  const uniqueCities = [...new Set(cityCodeFrom.map(code => code.trim().toUpperCase()).filter(Boolean))];
  const page = await searchFlights({
    cityCodeFrom: uniqueCities,
    cityCodeTo,
    departFromUtc: range.departFrom,
    departToUtc: range.departTo,
    page: 1,
    pageSize: searchPageSize(uniqueCities.length),
    includeTotal: false,
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

  const response = await fetch(`${API_BASE}/flights?${query}`, { signal: params.signal });
  if (!response.ok) {
    throw new Error('Failed to load flights');
  }
  return response.json() as Promise<FlightPage>;
}
