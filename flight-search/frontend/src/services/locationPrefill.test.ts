import { describe, expect, it } from 'vitest';
import {
  findCityByCode,
  rankCitiesByDistance,
  selectDefaultCityCodes,
  selectFallbackCityCodes
} from '../services/locationPrefill';
import type { City, HubScore } from '../types/city';

const hubScores: HubScore[] = [
  { code: 'PRG', offerCount: 120, minPrice: 40, averageQuality: 70, destinationCount: 20, hubScore: 8 },
  { code: 'VIE', offerCount: 500, minPrice: 35, averageQuality: 75, destinationCount: 40, hubScore: 8.5 },
  { code: 'BER', offerCount: 450, minPrice: 36, averageQuality: 74, destinationCount: 38, hubScore: 8.2 },
  { code: 'BRQ', offerCount: 0, minPrice: 0, averageQuality: 0, destinationCount: 0, hubScore: 3 },
  { code: 'WAW', offerCount: 700, minPrice: 35, averageQuality: 75, destinationCount: 50, hubScore: 8.5 },
  { code: 'LON', offerCount: 900, minPrice: 35, averageQuality: 75, destinationCount: 80, hubScore: 9 },
  { code: 'OSR', offerCount: 40, minPrice: 45, averageQuality: 65, destinationCount: 8, hubScore: 5 },
  { code: 'KTW', offerCount: 80, minPrice: 40, averageQuality: 70, destinationCount: 15, hubScore: 6 },
  { code: 'KRK', offerCount: 200, minPrice: 35, averageQuality: 72, destinationCount: 25, hubScore: 7 }
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
    code: 'BRQ',
    name: 'Brno',
    country: 'Czechia',
    region: null,
    continent: 'EU',
    latitude: 49.15,
    longitude: 16.69,
    isActive: true
  },
  {
    id: '5',
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
    id: '6',
    code: 'LON',
    name: 'London',
    country: 'United Kingdom',
    region: null,
    continent: 'EU',
    latitude: 51.5,
    longitude: -0.12,
    isActive: true
  },
  {
    id: '7',
    code: 'OSR',
    name: 'Ostrava',
    country: 'Czechia',
    region: null,
    continent: 'EU',
    latitude: 49.7,
    longitude: 18.11,
    isActive: true
  },
  {
    id: '8',
    code: 'KTW',
    name: 'Katowice',
    country: 'Poland',
    region: null,
    continent: 'EU',
    latitude: 50.47,
    longitude: 19.08,
    isActive: true
  },
  {
    id: '9',
    code: 'KRK',
    name: 'Krakow',
    country: 'Poland',
    region: null,
    continent: 'EU',
    latitude: 50.08,
    longitude: 19.8,
    isActive: true
  }
];

describe('locationPrefill', () => {
  it('defaults to the anchor only when no other airports are really close', () => {
    const defaults = selectDefaultCityCodes(cities, hubScores);

    expect(defaults).toEqual(['PRG']);
    expect(defaults).not.toContain('VIE');
    expect(defaults).not.toContain('BER');
    expect(defaults).not.toContain('BRQ');
  });

  it('includes only very close neighbour airports for Ostrava (Katowice, not Krakow)', () => {
    const defaults = selectDefaultCityCodes(cities, hubScores, 'OSR');

    expect(defaults[0]).toBe('OSR');
    expect(defaults).toContain('KTW');
    expect(defaults).not.toContain('KRK');
    expect(defaults).not.toContain('PRG');
    expect(defaults).not.toContain('WAW');
  });

  it('uses only the default anchor before hub scores are available', () => {
    expect(selectFallbackCityCodes(cities)).toEqual(['PRG']);
  });

  it('ranks cities by distance from an origin for empty dropdown suggestions', () => {
    const ranked = rankCitiesByDistance(cities, cities[0], {
      excludeCodes: ['PRG'],
      limit: 3
    });

    expect(ranked.map(city => city.code)).toEqual(['BRQ', 'VIE', 'BER']);
    expect(ranked[0].distanceKm).toBeLessThan(ranked[1].distanceKm);
  });

  it('finds cities by code case-insensitively', () => {
    expect(findCityByCode(cities, 'prg')?.code).toBe('PRG');
  });

});
