import type { City, HubScore } from '../types/city';
import type { Flight, FlightPage } from '../types/flight';
import { normalizeHubScore } from './hubScore';
const API_BASE = '/api';

export interface FlightSearchParams {
  cityCodeFrom: string[];
  departFromUtc: Date;
  departToUtc: Date;
  page?: number;
  pageSize?: number;
}

export interface WeekendFlightSearchWindow {
  departFrom: Date;
  departTo: Date;
}

function mergeFlightPages(pages: FlightPage[]): Flight[] {
  const byId = new Map<number, Flight>();
  for (const page of pages) {
    for (const flight of page.items) {
      byId.set(flight.id, flight);
    }
  }
  return [...byId.values()];
}

export async function searchFlightsForWeekends(
  cityCodeFrom: string[],
  weekends: WeekendFlightSearchWindow[],
  pageSize = 100
): Promise<Flight[]> {
  if (weekends.length === 0 || cityCodeFrom.length === 0) {
    return [];
  }

  const uniqueCities = [...new Set(cityCodeFrom.map(code => code.trim().toUpperCase()).filter(Boolean))];

  const pages = await Promise.all(
    uniqueCities.flatMap(cityCode =>
      weekends.map(weekend =>
        searchFlights({
          cityCodeFrom: [cityCode],
          departFromUtc: weekend.departFrom,
          departToUtc: weekend.departTo,
          page: 1,
          pageSize
        })
      )
    )
  );

  return mergeFlightPages(pages);
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
    pageSize: String(params.pageSize ?? 50)
  });

  const response = await fetch(`${API_BASE}/flights?${query}`);
  if (!response.ok) {
    throw new Error('Failed to load flights');
  }
  return response.json() as Promise<FlightPage>;
}
