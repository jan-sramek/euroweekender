import { describe, expect, it } from 'vitest';
import { SEO_PAGE_TYPES, seoContentKey } from './seoPageContent';

describe('seoContentKey', () => {
  it('omits destination for origin-only pages', () => {
    expect(seoContentKey(SEO_PAGE_TYPES.weekendFrom, 'prg', '', 'CS')).toBe('weekend-from:PRG:cs');
    expect(seoContentKey(SEO_PAGE_TYPES.dayTripsFrom, 'BER', null, 'de')).toBe(
      'day-trips-from:BER:de'
    );
  });

  it('includes destination for OD pages', () => {
    expect(seoContentKey(SEO_PAGE_TYPES.weekendOd, 'prg', 'bcn', 'en')).toBe(
      'weekend-od:PRG:BCN:en'
    );
  });
});
