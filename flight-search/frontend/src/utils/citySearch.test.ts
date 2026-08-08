import { describe, expect, it } from 'vitest';
import type { City } from '../types/city';
import { cityMatchesQuery, normalizeSearchText, rankCityMatch } from './citySearch';

const vienna: City = {
  id: '1',
  code: 'VIE',
  name: 'Vienna',
  country: 'Austria',
  region: null,
  continent: 'EU',
  latitude: 48.2,
  longitude: 16.3,
  isActive: true,
  aliases: ['Wien', 'Vienne', 'Viena']
};

const munich: City = {
  id: '2',
  code: 'MUC',
  name: 'Munich',
  country: 'Germany',
  region: null,
  continent: 'EU',
  latitude: 48.1,
  longitude: 11.5,
  isActive: true,
  aliases: ['München']
};

describe('citySearch', () => {
  it('matches after one character', () => {
    expect(cityMatchesQuery(vienna, 'v')).toBe(true);
    expect(cityMatchesQuery(vienna, 'W')).toBe(true);
  });

  it('matches localized aliases', () => {
    expect(cityMatchesQuery(vienna, 'Wien')).toBe(true);
    expect(cityMatchesQuery(vienna, 'vienne')).toBe(true);
  });

  it('folds diacritics for alias search', () => {
    expect(normalizeSearchText('München')).toBe('munchen');
    expect(cityMatchesQuery(munich, 'munchen')).toBe(true);
  });

  it('matches and ranks localized display names from suggest', () => {
    const munichCs = { ...munich, aliases: [], localizedName: 'Mnichov' };
    expect(cityMatchesQuery(munichCs, 'Mnichov')).toBe(true);
    expect(rankCityMatch(munichCs, 'Mnichov')).toBeLessThan(rankCityMatch(munich, 'ich'));
  });

  it('ranks IATA and prefix matches higher', () => {
    expect(rankCityMatch(vienna, 'VIE')).toBeLessThan(rankCityMatch(vienna, 'ien'));
    expect(rankCityMatch(vienna, 'Wien')).toBeLessThan(rankCityMatch(vienna, 'ena'));
  });
});
