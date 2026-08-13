import { describe, expect, it } from 'vitest';
import { localizedPath } from '../config/locales';

describe('localizedPath', () => {
  it('uses no trailing slash for locale home to match sitemap/canonical', () => {
    expect(localizedPath('en')).toBe('/en');
    expect(localizedPath('en', '/')).toBe('/en');
  });

  it('prefixes nested routes without a trailing slash', () => {
    expect(localizedPath('es', '/about')).toBe('/es/about');
    expect(localizedPath('de', 'faq')).toBe('/de/faq');
  });
});
