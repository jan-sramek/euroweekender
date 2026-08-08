import { describe, expect, it } from 'vitest';
import { countryFlagCode } from './countryFlag';

describe('countryFlagCode', () => {
  it('maps European country names to flagcdn codes', () => {
    expect(countryFlagCode('Austria')).toBe('at');
    expect(countryFlagCode('Czechia')).toBe('cz');
    expect(countryFlagCode('United Kingdom')).toBe('gb');
  });

  it('returns null for unknown countries', () => {
    expect(countryFlagCode('Atlantis')).toBeNull();
    expect(countryFlagCode('')).toBeNull();
  });
});
