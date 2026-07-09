import type { City, HubScore } from '../types/city';
import type { Flight, FlightPage } from '../types/flight';
import { normalizeHubScore } from './hubScore';
import { getWeekendSearchRange } from './weekend';

const API_BASE = '/api';
const FLIGHTS_PER_CITY = 200;
const MAX_SEARCH_FLIGHTS = 1000;
const SINGLE_CITY_PAGE_SIZE = 500;
const CITIES_CACHE_KEY = 'ew:cities:v2';
const CITIES_CACHE_TTL_MS = 60 * 60 * 1000;

function searchPageSize(cityCount: number): number {
  if (cityCount <= 1) return SINGLE_CITY_PAGE_SIZE;
  return Math.min(MAX_SEARCH_FLIGHTS, cityCount * FLIGHTS_PER_CITY);
}

export interface FlightSearchParams {
  cityCodeFrom: string[];
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
  signal?: AbortSignal
): Promise<Flight[]> {
  if (weekends.length === 0 || cityCodeFrom.length === 0) {
    return [];
  }

  const range = getWeekendSearchRange(weekends);
  if (!range) return [];

  const uniqueCities = [...new Set(cityCodeFrom.map(code => code.trim().toUpperCase()).filter(Boolean))];
  const page = await searchFlights({
    cityCodeFrom: uniqueCities,
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
  const cities = (await response.json()) as City[];
  writeCitiesCache(cities);
  return cities;
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

export async function getHubScores(weeks = 4): Promise<HubScore[]> {
  const response = await fetch(`${API_BASE}/cities/hub-scores?weeks=${weeks}`);
  if (!response.ok) {
    throw new Error(`Failed to load hub scores (${response.status})`);
  }
  const payload = (await response.json()) as Record<string, unknown>[];
  return payload.map(normalizeHubScore).filter(score => score.code.length > 0);
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

  const response = await fetch(`${API_BASE}/flights?${query}`, { signal: params.signal });
  if (!response.ok) {
    throw new Error('Failed to load flights');
  }
  return response.json() as Promise<FlightPage>;
}
