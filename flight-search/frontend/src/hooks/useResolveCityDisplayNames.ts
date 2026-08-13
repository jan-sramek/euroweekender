import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { getLocalizedCityNames, replaceCitiesCache } from '../services/api';
import type { City } from '../types/city';
import { applyLocalizedNames, getCityDisplayName } from '../utils/cityDisplayName';
import { useLocale } from './useLocale';

/**
 * Resolve missing localized display names for the given city codes via one
 * batched Kiwi lookup, then merge them into cities. Uses the URL locale so
 * names do not flash English while i18n is still catching up.
 */
export function useResolveCityDisplayNames(
  cities: City[],
  setCities: Dispatch<SetStateAction<City[]>>,
  codes: string[],
  languageOverride?: string
): void {
  const urlLocale = useLocale();
  const language = languageOverride || urlLocale;
  const codesKey = codes
    .map(code => code.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join('|');
  const attemptedRef = useRef(new Set<string>());

  useEffect(() => {
    if (cities.length === 0 || !codesKey) return;

    const base = language.toLowerCase().split('-')[0] ?? 'en';
    if (base === 'en') return;

    const needed = codesKey.split('|').filter(code => {
      const key = `${language}:${code}`;
      if (attemptedRef.current.has(key)) return false;
      const city = cities.find(item => item.code.toUpperCase() === code);
      if (!city) return false;
      return getCityDisplayName(city, language) === city.name;
    });

    if (needed.length === 0) return;

    for (const code of needed) {
      attemptedRef.current.add(`${language}:${code}`);
    }

    let cancelled = false;

    void getLocalizedCityNames(language, needed)
      .then(names => {
        if (cancelled || Object.keys(names).length === 0) return;
        setCities(prev => {
          const next = applyLocalizedNames(prev, names, language);
          if (next !== prev) replaceCitiesCache(next);
          return next;
        });
      })
      .catch(() => {
        // Keep English names when Kiwi localize is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [cities, codesKey, language, setCities]);
}
