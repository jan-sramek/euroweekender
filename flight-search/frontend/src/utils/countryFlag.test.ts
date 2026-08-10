import { describe, expect, it } from 'vitest';
import { countryFlagCode } from './countryFlag';

describe('countryFlagCode', () => {
  it('maps European country names to flagcdn codes', () => {
    expect(countryFlagCode('Austria')).toBe('at');
    expect(countryFlagCode('Czechia')).toBe('cz');
    expect(countryFlagCode('United Kingdom')).toBe('gb');
  });

  it('maps Skopje / North Macedonia country labels to mk', () => {
    expect(countryFlagCode('North Macedonia')).toBe('mk');
    expect(countryFlagCode('Macedonia')).toBe('mk');
    expect(countryFlagCode('Republic of North Macedonia')).toBe('mk');
    expect(countryFlagCode('Macedonia (FYROM)')).toBe('mk');
    expect(countryFlagCode('MK')).toBe('mk');
  });

  it('maps Bosnia country labels including Kiwi ampersand form to ba', () => {
    expect(countryFlagCode('Bosnia and Herzegovina')).toBe('ba');
    expect(countryFlagCode('Bosnia & Herzegovina')).toBe('ba');
    expect(countryFlagCode('Bosnia')).toBe('ba');
    expect(countryFlagCode('BA')).toBe('ba');
    expect(countryFlagCode('BIH')).toBe('ba');
  });

  it('returns null for unknown countries', () => {
    expect(countryFlagCode('Atlantis')).toBeNull();
    expect(countryFlagCode('')).toBeNull();
  });
});
