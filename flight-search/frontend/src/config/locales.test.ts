import { describe, expect, it } from 'vitest';
import { localizedPath } from './locales';
import {
  indexableLocalesForOrigin,
  isStaticIndexableLocale,
  preferredIndexableLocale,
  STATIC_INDEXABLE_LOCALE_CODES
} from './cityIndexLocales';

describe('localizedPath', () => {
  it('uses no trailing slash for locale home to match sitemap/canonical', () => {
    expect(localizedPath('en')).toBe('/en');
    expect(localizedPath('en', '/')).toBe('/en');
  });

  it('prefixes nested routes without a trailing slash', () => {
    expect(localizedPath('es', '/about')).toBe('/es/about');
    expect(localizedPath('de', 'faq')).toBe('/de/faq');
  });

  it('keeps query strings and hashes after the locale prefix', () => {
    expect(
      localizedPath(
        'en',
        '/weekend-flights/prague-prg-to-barcelona-bcn?month=2026-10#weekend-calendar'
      )
    ).toBe('/en/weekend-flights/prague-prg-to-barcelona-bcn?month=2026-10#weekend-calendar');
  });
});

describe('static indexable locales', () => {
  it('indexes major markets on homepage/tools', () => {
    expect(isStaticIndexableLocale('en')).toBe(true);
    expect(isStaticIndexableLocale('cs')).toBe(true);
    expect(isStaticIndexableLocale('de')).toBe(true);
    expect(STATIC_INDEXABLE_LOCALE_CODES).toContain('pl');
  });

  it('does not index tiny locales on static pages', () => {
    expect(isStaticIndexableLocale('lv')).toBe(false);
    expect(isStaticIndexableLocale('lt')).toBe(false);
    expect(isStaticIndexableLocale('et')).toBe(false);
    expect(isStaticIndexableLocale('is')).toBe(false);
  });
});

describe('indexableLocalesForOrigin', () => {
  it('indexes Prague in English and Czech, not Latvian', () => {
    expect(indexableLocalesForOrigin('PRG')).toEqual(['en', 'cs']);
  });

  it('indexes Berlin in English and German', () => {
    expect(indexableLocalesForOrigin('BER')).toEqual(['en', 'de']);
  });

  it('indexes Riga in English and Latvian', () => {
    expect(indexableLocalesForOrigin('RIX')).toEqual(['en', 'lv']);
  });

  it('indexes London in English only', () => {
    expect(indexableLocalesForOrigin('LON')).toEqual(['en']);
  });

  it('indexes Brussels in English, French, and Dutch', () => {
    expect(indexableLocalesForOrigin('BRU')).toEqual(['en', 'fr', 'nl']);
  });

  it('indexes Geneva in English and French, Zurich in English and German', () => {
    expect(indexableLocalesForOrigin('GVA')).toEqual(['en', 'fr']);
    expect(indexableLocalesForOrigin('ZRH')).toEqual(['en', 'de']);
  });

  it('falls back to English when the local language is not a UI locale', () => {
    expect(indexableLocalesForOrigin('ZAG')).toEqual(['en']);
  });

  it('uses a country name hint when the IATA code is unknown', () => {
    expect(indexableLocalesForOrigin('XXX', 'Poland')).toEqual(['en', 'pl']);
  });
});

describe('preferredIndexableLocale', () => {
  it('keeps the current locale when that city page is indexed', () => {
    expect(preferredIndexableLocale('cs', 'PRG')).toBe('cs');
    expect(preferredIndexableLocale('en', 'PRG')).toBe('en');
    expect(preferredIndexableLocale('de', 'BER')).toBe('de');
  });

  it('switches to the local language instead of a non-indexable UI locale', () => {
    expect(preferredIndexableLocale('cs', 'BER')).toBe('de');
    expect(preferredIndexableLocale('lv', 'PRG')).toBe('cs');
    expect(preferredIndexableLocale('de', 'BRU')).toBe('fr');
  });

  it('falls back to English when the city has no other indexed locale', () => {
    expect(preferredIndexableLocale('de', 'LON')).toBe('en');
    expect(preferredIndexableLocale('cs', 'ZAG')).toBe('en');
  });
});
