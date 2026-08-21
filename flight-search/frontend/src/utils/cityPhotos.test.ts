import { describe, expect, it } from 'vitest';
import { getCuratedCityPhoto, getFallbackCityPhoto, wikipediaPhotoCacheKey } from './cityPhotos';

describe('cityPhotos', () => {
  it('returns curated photos by city code', () => {
    expect(getCuratedCityPhoto('bcn')).toContain('unsplash.com');
    expect(getCuratedCityPhoto('ROM')).toContain('unsplash.com');
    expect(getCuratedCityPhoto('XYZ')).toBeNull();
  });

  it('exposes a fallback city image', () => {
    expect(getFallbackCityPhoto()).toContain('unsplash.com');
  });

  it('normalizes wikipedia cache keys', () => {
    expect(wikipediaPhotoCacheKey(' bcn ')).toBe('ew-city-photo:BCN');
  });
});
