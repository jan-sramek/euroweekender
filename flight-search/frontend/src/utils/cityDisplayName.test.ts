import { describe, expect, it } from 'vitest';
import { getCityDisplayName, getCityNameByCode, indexCitiesByCode } from './cityDisplayName';
import type { City } from '../types/city';

const prague: City = {
  id: '1',
  code: 'PRG',
  name: 'Prague',
  country: 'Czechia',
  region: null,
  continent: 'EU',
  latitude: 50.1,
  longitude: 14.4,
  isActive: true,
  namesByLocale: {
    'en-US': 'Prague',
    'cs-CZ': 'Praha',
    'de-DE': 'Prag'
  }
};

describe('cityDisplayName', () => {
  it('returns localized name for the active UI language', () => {
    expect(getCityDisplayName(prague, 'cs')).toBe('Praha');
    expect(getCityDisplayName(prague, 'de')).toBe('Prag');
    expect(getCityDisplayName(prague, 'en')).toBe('Prague');
  });

  it('falls back to English name when locale is missing', () => {
    expect(getCityDisplayName({ ...prague, namesByLocale: {} }, 'cs')).toBe('Prague');
  });

  it('looks up a localized name by IATA code', () => {
    const byCode = indexCitiesByCode([prague]);
    expect(getCityNameByCode(byCode, 'prg', 'cs', 'Prague')).toBe('Praha');
    expect(getCityNameByCode(byCode, 'BCN', 'cs', 'Barcelona')).toBe('Barcelona');
    expect(getCityNameByCode(undefined, 'PRG', 'cs', 'Prague')).toBe('Prague');
  });
});
