import { describe, expect, it } from 'vitest';
import {
  findCityByCode,
  rankNearbyCities,
  rankPopularHubCities,
  selectDefaultCityCodes
} from '../services/locationPrefill';
import type { City, HubScore } from '../types/city';

const hubScores: HubScore[] = [
  { code: 'PRG', offerCount: 120, minPrice: 40, averageQuality: 70, destinationCount: 20, hubScore: 8 },
  { code: 'VIE', offerCount: 500, minPrice: 35, averageQuality: 75, destinationCount: 40, hubScore: 8.5 },
  { code: 'BER', offerCount: 450, minPrice: 36, averageQuality: 74, destinationCount: 38, hubScore: 8.2 },
  { code: 'WAW', offerCount: 700, minPrice: 35, averageQuality: 75, destinationCount: 50, hubScore: 8.5 },
  { code: 'LON', offerCount: 900, minPrice: 35, averageQuality: 75, destinationCount: 80, hubScore: 9 }
];

const cities: City[] = [
  {
    id: '1',
    code: 'PRG',
    name: 'Prague',
    country: 'Czechia',
    region: null,
    continent: 'EU',
    latitude: 50.1,
    longitude: 14.26,
    isActive: true
  },
  {
    id: '2',
    code: 'VIE',
    name: 'Vienna',
    country: 'Austria',
    region: null,
    continent: 'EU',
    latitude: 48.21,
    longitude: 16.37,
    isActive: true
  },
  {
    id: '3',
    code: 'BER',
    name: 'Berlin',
    country: 'Germany',
    region: null,
    continent: 'EU',
    latitude: 52.52,
    longitude: 13.4,
    isActive: true
  },
  {
    id: '4',
    code: 'WAW',
    name: 'Warsaw',
    country: 'Poland',
    region: null,
    continent: 'EU',
    latitude: 52.23,
    longitude: 21.01,
    isActive: true
  },
  {
    id: '5',
    code: 'LON',
    name: 'London',
    country: 'United Kingdom',
    region: null,
    continent: 'EU',
    latitude: 51.5,
    longitude: -0.12,
    isActive: true
  }
];

describe('locationPrefill', () => {
  it('selects nearby airports around Prague by default without distant hubs like London', () => {
    const defaults = selectDefaultCityCodes(cities, hubScores);

    expect(defaults[0]).toBe('PRG');
    expect(defaults).not.toContain('LON');
    expect(defaults.length).toBeGreaterThan(1);
  });

  it('finds cities by code case-insensitively', () => {
    expect(findCityByCode(cities, 'prg')?.code).toBe('PRG');
  });

  it('ranks popular hubs outside nearby airports by offer count within max distance', () => {
    const anchor = { latitude: 50.1, longitude: 14.26 };
    const nearby = rankNearbyCities(cities, anchor, hubScores, 10, 350);
    const popular = rankPopularHubCities(cities, anchor, hubScores, nearby, 10, 50, 1000);

    expect(nearby.map(city => city.code)).toContain('PRG');
    expect(popular.map(city => city.code)).not.toContain('PRG');
    expect(popular.map(city => city.code)).toEqual(['WAW']);
    expect(popular.every(city => city.distanceKm <= 1000)).toBe(true);
  });
});
