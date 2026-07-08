import type { City, HubScore } from '../types/city';
import type { Flight, FlightPage } from '../types/flight';
import { normalizeHubScore } from './hubScore';
import { getWeekendSearchRange } from './weekend';

const API_BASE = '/api';
const SEARCH_PAGE_SIZE = 500;

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
    pageSize: SEARCH_PAGE_SIZE,
    includeTotal: false,
    signal
  });

  return page.items;
}

export async function getCities(): Promise<City[]> {
  const response = await fetch(`${API_BASE}/cities`);
  if (!response.ok) {
    throw new Error('Failed to load cities');
  }
  return response.json() as Promise<City[]>;
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
