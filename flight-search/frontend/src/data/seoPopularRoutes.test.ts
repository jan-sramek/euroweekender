import { describe, expect, it } from 'vitest';
import { isPrerenderedOdPair, weekendComparePath } from './seoPopularRoutes';

describe('isPrerenderedOdPair', () => {
  it('allows capped hub × popular-destination landings', () => {
    expect(isPrerenderedOdPair('BER', 'ROM')).toBe(true);
    expect(isPrerenderedOdPair('muc', 'bcn')).toBe(true);
  });

  it('rejects destinations outside the prerender cap', () => {
    expect(isPrerenderedOdPair('BER', 'OSL')).toBe(false);
    expect(isPrerenderedOdPair('HAJ', 'MUC')).toBe(false);
  });

  it('rejects London origins until they fall inside the hub cap', () => {
    expect(isPrerenderedOdPair('LON', 'BCN')).toBe(false);
  });
});

describe('weekendComparePath', () => {
  it('uses the OD landing when prerendered', () => {
    expect(
      weekendComparePath({ code: 'PRG', name: 'Prague' }, { code: 'BCN', name: 'Barcelona' })
    ).toBe('/weekend-flights/prague-prg-to-barcelona-bcn');
  });

  it('falls back to the compare-weekends tool for other pairs', () => {
    expect(
      weekendComparePath({ code: 'BER', name: 'Berlin' }, { code: 'OSL', name: 'Oslo' })
    ).toBe('/cheapest-weekend?from=BER&to=OSL');
  });
});
