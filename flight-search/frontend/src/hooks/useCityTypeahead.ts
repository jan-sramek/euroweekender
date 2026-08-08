import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { rememberCityAlias, rememberCityLocalizedName, suggestCities } from '../services/api';
import type { City, CitySuggestion } from '../types/city';
import { cityMatchesQuery, rankCityMatch } from '../utils/citySearch';

const SUGGEST_DEBOUNCE_MS = 250;

interface UseCityTypeaheadOptions {
  allCities: City[];
  query: string;
  excludeCodes?: string[];
  filterCity?: (city: City) => boolean;
  limit?: number;
}

export interface CityTypeaheadState {
  results: CitySuggestion[];
  isSearching: boolean;
}

function mergeAlias(city: City, alias: string): City {
  const normalized = alias.trim();
  if (!normalized) return city;
  const aliases = city.aliases ?? [];
  if (
    aliases.some(existing => existing.toLowerCase() === normalized.toLowerCase()) ||
    city.name.toLowerCase() === normalized.toLowerCase()
  ) {
    return city;
  }
  return { ...city, aliases: [...aliases, normalized] };
}

function isEnglishUiLanguage(language: string | undefined): boolean {
  const base = (language ?? 'en').toLowerCase().split('-')[0];
  return base === 'en';
}

export function useCityTypeahead({
  allCities,
  query,
  excludeCodes = [],
  filterCity,
  limit = 8
}: UseCityTypeaheadOptions): CityTypeaheadState {
  const { i18n } = useTranslation();
  const [remoteSuggestions, setRemoteSuggestions] = useState<CitySuggestion[]>([]);
  const [learnedAliases, setLearnedAliases] = useState<Record<string, string[]>>({});
  const [isSearching, setIsSearching] = useState(false);

  // Stabilize dependency: callers often pass a fresh array literal each render.
  const excludeKey = excludeCodes.map(code => code.trim().toUpperCase()).filter(Boolean).sort().join('|');

  const excluded = useMemo(
    () => new Set(excludeKey ? excludeKey.split('|') : []),
    [excludeKey]
  );

  const citiesWithLearnedAliases = useMemo(
    () =>
      allCities.map(city => {
        const learned = learnedAliases[city.code.toUpperCase()];
        if (!learned?.length) return city;
        return learned.reduce((current, alias) => mergeAlias(current, alias), city);
      }),
    [allCities, learnedAliases]
  );

  const localResults = useMemo(() => {
    const q = query.trim();
    if (q.length < 1) return [];

    return citiesWithLearnedAliases
      .filter(city => {
        if (excluded.has(city.code.toUpperCase())) return false;
        if (filterCity && !filterCity(city)) return false;
        return cityMatchesQuery(city, q);
      })
      .sort((a, b) => rankCityMatch(a, q) - rankCityMatch(b, q) || a.name.localeCompare(b.name))
      .slice(0, limit);
  }, [citiesWithLearnedAliases, excluded, filterCity, limit, query]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setRemoteSuggestions(prev => (prev.length === 0 ? prev : []));
      setIsSearching(prev => (prev ? false : prev));
      return;
    }

    // English UI can rely on local English names. Other languages need Tequila even when
    // some English substring matches exist (e.g. "Pa" → Paris) so "Mnichov"/"Paříž" still resolve.
    const englishUi = isEnglishUiLanguage(i18n.language);
    if (englishUi && localResults.length > 0) {
      setRemoteSuggestions(prev => (prev.length === 0 ? prev : []));
      setIsSearching(prev => (prev ? false : prev));
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await suggestCities(q, i18n.language || 'en', controller.signal);
        if (controller.signal.aborted) return;

        const usable = suggestions.filter(city => {
          if (excluded.has(city.code.toUpperCase())) return false;
          if (filterCity && !filterCity(city)) return false;
          return true;
        });

        setRemoteSuggestions(usable);

        if (usable.length > 0) {
          const language = i18n.language || 'en';
          setLearnedAliases(prev => {
            const next = { ...prev };
            for (const city of usable) {
              const key = city.code.toUpperCase();
              const aliases = new Set(next[key] ?? []);
              if (city.localizedName) {
                aliases.add(city.localizedName);
                rememberCityLocalizedName(city.code, language, city.localizedName);
              }
              aliases.add(q);
              next[key] = [...aliases];
              for (const alias of aliases) {
                rememberCityAlias(city.code, alias);
              }
            }
            return next;
          });
        }
      } catch {
        if (controller.signal.aborted) return;
        setRemoteSuggestions(prev => (prev.length === 0 ? prev : []));
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [excludeKey, excluded, filterCity, i18n.language, localResults.length, query]);

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 1) return [];

    const byCode = new Map<string, CitySuggestion>();
    // Prefer remote (localized) rows when both exist so Czech labels win over English-only locals.
    for (const city of localResults) {
      byCode.set(city.code.toUpperCase(), city);
    }
    for (const city of remoteSuggestions) {
      const key = city.code.toUpperCase();
      const existing = byCode.get(key);
      if (!existing || city.localizedName) {
        byCode.set(key, {
          ...existing,
          ...city,
          aliases: [...new Set([...(existing?.aliases ?? []), ...(city.aliases ?? [])])],
          namesByLocale: {
            ...(existing?.namesByLocale ?? {}),
            ...(city.namesByLocale ?? {})
          },
          localizedName: city.localizedName ?? existing?.localizedName
        });
      }
    }

    return [...byCode.values()]
      .sort((a, b) => rankCityMatch(a, q) - rankCityMatch(b, q) || a.name.localeCompare(b.name))
      .slice(0, limit);
  }, [limit, localResults, query, remoteSuggestions]);

  return { results, isSearching };
}
