import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import {
  rememberCityLocalizedName,
  replaceCitiesCache,
  suggestCities
} from '../services/api';
import type { City } from '../types/city';
import { getCityDisplayName, withLocalizedName } from '../utils/cityDisplayName';
import { toTequilaLocale } from '../utils/tequilaLocale';

/**
 * For the active UI language, resolve missing localized display names for the
 * given city codes via Tequila suggest (by IATA code) and merge them into cities.
 */
export function useResolveCityDisplayNames(
  cities: City[],
  setCities: Dispatch<SetStateAction<City[]>>,
  codes: string[]
): void {
  const { i18n } = useTranslation();
  const language = i18n.language || 'en';
  const codesKey = codes
    .map(code => code.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join('|');
  const inFlightRef = useRef(new Set<string>());

  useEffect(() => {
    if (cities.length === 0 || !codesKey) return;

    const tequilaLocale = toTequilaLocale(language);
    const base = language.toLowerCase().split('-')[0] ?? 'en';
    if (base === 'en') return;

    const wanted = new Set(codesKey.split('|'));
    const needed = cities
      .filter(city => wanted.has(city.code.toUpperCase()))
      .filter(city => getCityDisplayName(city, language) === city.name)
      .filter(city => !inFlightRef.current.has(`${tequilaLocale}:${city.code.toUpperCase()}`))
      .slice(0, 12);

    if (needed.length === 0) return;

    let cancelled = false;

    async function resolve() {
      const resolved = new Map<string, string>();

      await Promise.all(
        needed.map(async city => {
          const key = `${tequilaLocale}:${city.code.toUpperCase()}`;
          inFlightRef.current.add(key);
          try {
            const suggestions = await suggestCities(city.code, language);
            const match =
              suggestions.find(item => item.code.toUpperCase() === city.code.toUpperCase()) ??
              suggestions[0];
            const localized = match?.localizedName?.trim();
            if (localized && localized.toLowerCase() !== city.name.toLowerCase()) {
              resolved.set(city.code.toUpperCase(), localized);
              rememberCityLocalizedName(city.code, language, localized);
            }
          } catch {
            // Keep English name when suggest is unavailable.
          } finally {
            inFlightRef.current.delete(key);
          }
        })
      );

      if (cancelled || resolved.size === 0) return;

      setCities(prev => {
        const next = prev.map(city => {
          const localized = resolved.get(city.code.toUpperCase());
          return localized ? withLocalizedName(city, language, localized) : city;
        });
        replaceCitiesCache(next);
        return next;
      });
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [cities, codesKey, language, setCities]);
}
