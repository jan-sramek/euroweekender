import { describe, expect, it } from 'vitest';
import {
  buildCitySlug,
  parseCityCodeFromSlug,
  slugifyCityName,
  weekendFlightsFromPath,
  weekendFlightsFromPathByCode
} from './citySlug';

describe('slugifyCityName', () => {
  it('folds diacritics and lowercases', () => {
    expect(slugifyCityName('Zürich')).toBe('zurich');
    expect(slugifyCityName('São Paulo')).toBe('sao-paulo');
  });

  it('replaces non-alphanumeric runs with hyphens', () => {
    expect(slugifyCityName('New York')).toBe('new-york');
    expect(slugifyCityName('  Prague  ')).toBe('prague');
  });

  it('collapses repeated hyphens', () => {
    expect(slugifyCityName('foo---bar')).toBe('foo-bar');
  });
});

describe('buildCitySlug', () => {
  it('builds canonical name-code slug', () => {
    expect(buildCitySlug({ code: 'PRG', name: 'Prague' })).toBe('prague-prg');
    expect(buildCitySlug({ code: 'VIE', name: 'Vienna' })).toBe('vienna-vie');
  });

  it('falls back to code when name slug is empty', () => {
    expect(buildCitySlug({ code: 'PRG', name: '---' })).toBe('prg-prg');
  });
});

describe('parseCityCodeFromSlug', () => {
  it('parses trailing IATA from slug', () => {
    expect(parseCityCodeFromSlug('prague-prg')).toBe('PRG');
    expect(parseCityCodeFromSlug('london-lon')).toBe('LON');
  });

  it('parses bare three-letter code', () => {
    expect(parseCityCodeFromSlug('prg')).toBe('PRG');
    expect(parseCityCodeFromSlug('PRG')).toBe('PRG');
  });

  it('returns null for missing or invalid slugs', () => {
    expect(parseCityCodeFromSlug(undefined)).toBeNull();
    expect(parseCityCodeFromSlug('')).toBeNull();
    expect(parseCityCodeFromSlug('prague')).toBeNull();
    expect(parseCityCodeFromSlug('prague-pr')).toBeNull();
  });
});

describe('weekendFlightsFromPath', () => {
  it('builds route path from city', () => {
    expect(weekendFlightsFromPath({ code: 'PRG', name: 'Prague' })).toBe(
      '/weekend-flights-from/prague-prg'
    );
  });
});

describe('weekendFlightsFromPathByCode', () => {
  it('uses bare code when name is omitted', () => {
    expect(weekendFlightsFromPathByCode('PRG')).toBe('/weekend-flights-from/prg');
  });

  it('builds canonical path when name is provided', () => {
    expect(weekendFlightsFromPathByCode('PRG', 'Prague')).toBe(
      '/weekend-flights-from/prague-prg'
    );
  });
});
