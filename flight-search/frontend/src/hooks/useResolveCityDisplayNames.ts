import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { getLocalizedCityNames, replaceCitiesCache } from '../services/api';
import type { City } from '../types/city';
import { applyLocalizedNames, getCityDisplayName } from '../utils/cityDisplayName';
import { trackPriorityCityNameLoad } from './useCityNameLoading';
import { useLocale } from './useLocale';

const attemptedKeys = new Set<string>();

function neededCodes(cities: City[], codes: string[], language: string): string[] {
  return codes.filter(code => {
    const key = `${language}:${code}`;
    if (attemptedKeys.has(key)) return false;
    const city = cities.find(item => item.code.toUpperCase() === code);
    if (!city) return false;
    return getCityDisplayName(city, language) === city.name;
  });
}

/**
 * Resolve missing localized display names for the given city codes via batched
 * Kiwi lookups. Priority codes (selected airports) run first and drive the
 * language-switch indicator; extra codes fill in the flight list in the background.
 */
export function useResolveCityDisplayNames(
  cities: City[],
  setCities: Dispatch<SetStateAction<City[]>>,
  priorityCodes: string[],
  extraCodes: string[] = [],
  languageOverride?: string
): void {
  const urlLocale = useLocale();
  const language = languageOverride || urlLocale;
  const priorityKey = normalizeCodesKey(priorityCodes);
  const extraKey = normalizeCodesKey(extraCodes);

  const applyNames = (names: Record<string, string>) => {
    if (Object.keys(names).length === 0) return;
    setCities(prev => {
      const next = applyLocalizedNames(prev, names, language);
      if (next !== prev) replaceCitiesCache(next);
      return next;
    });
  };

  useEffect(() => {
    if (cities.length === 0 || !priorityKey) return;
    const base = language.toLowerCase().split('-')[0] ?? 'en';
    if (base === 'en') return;

    const needed = neededCodes(cities, priorityKey.split('|'), language);
    if (needed.length === 0) return;

    for (const code of needed) attemptedKeys.add(`${language}:${code}`);

    let cancelled = false;
    const request = getLocalizedCityNames(language, needed).then(names => {
      if (!cancelled) applyNames(names);
    });
    void trackPriorityCityNameLoad(request).catch(() => {
      // Keep English names when Kiwi localize is unavailable.
    });

    return () => {
      cancelled = true;
      for (const code of needed) attemptedKeys.delete(`${language}:${code}`);
    };
  }, [cities, language, priorityKey, setCities]);

  const extraTimer = useRef<number>(0);

  useEffect(() => {
    if (cities.length === 0 || !extraKey) return;
    const base = language.toLowerCase().split('-')[0] ?? 'en';
    if (base === 'en') return;

    const needed = neededCodes(cities, extraKey.split('|'), language);
    if (needed.length === 0) return;

    window.clearTimeout(extraTimer.current);
    extraTimer.current = window.setTimeout(() => {
      for (const code of needed) attemptedKeys.add(`${language}:${code}`);
      void getLocalizedCityNames(language, needed)
        .then(applyNames)
        .catch(() => {
          // Keep English names when Kiwi localize is unavailable.
        });
    }, 400);

    return () => {
      window.clearTimeout(extraTimer.current);
    };
  }, [cities, extraKey, language, setCities]);
}

function normalizeCodesKey(codes: string[]): string {
  return [...new Set(codes.map(code => code.trim().toUpperCase()).filter(Boolean))].sort().join('|');
}
