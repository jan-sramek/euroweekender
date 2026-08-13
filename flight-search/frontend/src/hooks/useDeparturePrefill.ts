import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import i18n from '../i18n';
import { getCachedHubScores, getCities, getHubScores } from '../services/api';
import {
  findCityByCode,
  rankNearbyCities,
  selectDefaultCityCodes,
  selectFallbackCityCodes
} from '../services/locationPrefill';
import type { City, CityWithDistance, HubScore } from '../types/city';
import { indexCitiesByCode } from '../utils/cityDisplayName';
import { useLocale } from './useLocale';
import { useResolveCityDisplayNames } from './useResolveCityDisplayNames';

const SELECTED_ORIGINS_KEY = 'ew.selectedOrigins';

function readStoredOrigins(): string[] | null {
  try {
    const raw = sessionStorage.getItem(SELECTED_ORIGINS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const codes = parsed
      .filter((code): code is string => typeof code === 'string')
      .map(code => code.trim().toUpperCase())
      .filter(Boolean);
    return codes.length > 0 ? codes : null;
  } catch {
    return null;
  }
}

function writeStoredOrigins(codes: string[]): void {
  try {
    if (codes.length === 0) {
      sessionStorage.removeItem(SELECTED_ORIGINS_KEY);
      return;
    }
    sessionStorage.setItem(SELECTED_ORIGINS_KEY, JSON.stringify(codes));
  } catch {
    // Ignore quota or private-mode storage errors.
  }
}

function updateNearbySuggestions(
  cities: City[],
  scores: HubScore[],
  anchorCity: City
): CityWithDistance[] {
  const anchor = { latitude: anchorCity.latitude, longitude: anchorCity.longitude };
  return rankNearbyCities(cities, anchor, scores);
}

function resolveStoredOrigins(cities: City[], stored: string[] | null): string[] {
  if (!stored || stored.length === 0) return [];
  return stored.filter(code => Boolean(findCityByCode(cities, code)));
}

export function useDeparturePrefill(options?: {
  preferredCodes?: string[] | null;
  /** Extra city codes to localize for the active UI language (e.g. destination). */
  localizeCodes?: string[] | null;
}) {
  const preferredKey = (options?.preferredCodes ?? [])
    .map(code => code.trim().toUpperCase())
    .filter(Boolean)
    .join('|');
  const localizeKey = (options?.localizeCodes ?? [])
    .map(code => code.trim().toUpperCase())
    .filter(Boolean)
    .join('|');
  const locale = useLocale();
  const [allCities, setAllCities] = useState<City[]>([]);
  const [nearbyCities, setNearbyCities] = useState<CityWithDistance[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() =>
    preferredKey ? preferredKey.split('|') : []
  );
  const [extraLocalizeCodes, setExtraLocalizeCodes] = useState<string[]>([]);
  const [locating, setLocating] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const hubScoresRef = useRef<HubScore[]>([]);
  const defaultsInitializedRef = useRef(false);

  const refreshHubSuggestions = useCallback((cities: City[], scores: HubScore[], primaryCode: string) => {
    const anchorCity = findCityByCode(cities, primaryCode);
    if (!anchorCity) {
      setNearbyCities([]);
      return;
    }

    setNearbyCities(updateNearbySuggestions(cities, scores, anchorCity));
  }, []);

  const applyDefaults = useCallback(
    (cities: City[], codes: string[], scores: HubScore[]) => {
      const next = codes.length > 0 ? codes : selectFallbackCityCodes(cities);
      setSelectedCodes(next);
      defaultsInitializedRef.current = true;
      setLocating(false);
      refreshHubSuggestions(cities, scores, next[0] ?? '');
      writeStoredOrigins(next);
    },
    [refreshHubSuggestions]
  );

  const localizeCityCodes = useCallback((codes: string[]) => {
    const incoming = codes.map(code => code.trim().toUpperCase()).filter(Boolean);
    if (incoming.length === 0) return;
    setExtraLocalizeCodes(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const code of incoming) {
        if (!next.has(code)) {
          next.add(code);
          changed = true;
        }
      }
      return changed ? [...next] : prev;
    });
  }, []);

  const primaryCode = selectedCodes[0] ?? '';
  const codesToLocalize = [
    ...selectedCodes,
    ...(localizeKey ? localizeKey.split('|') : []),
    ...extraLocalizeCodes
  ];

  useResolveCityDisplayNames(allCities, setAllCities, codesToLocalize, locale);

  useEffect(() => {
    if (allCities.length === 0 || !primaryCode) return;
    refreshHubSuggestions(allCities, hubScoresRef.current, primaryCode);
  }, [allCities, primaryCode, refreshHubSuggestions]);

  useEffect(() => {
    if (!defaultsInitializedRef.current || preferredKey) return;
    writeStoredOrigins(selectedCodes);
  }, [selectedCodes, preferredKey]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (defaultsInitializedRef.current) return;

      // Prefetch hub scores while cities load (often the slower call).
      const scoresPromise = getHubScores().then(
        scores => ({ scores, error: false as const }),
        () => ({ scores: [] as HubScore[], error: true as const })
      );

      try {
        const cities = await getCities();
        if (cancelled) return;
        setAllCities(cities);

        const preferred = preferredKey
          .split('|')
          .filter(code => Boolean(findCityByCode(cities, code)));

        if (preferred.length > 0) {
          setSelectedCodes(preferred);
          defaultsInitializedRef.current = true;
          setLocating(false);

          const result = await scoresPromise;
          if (cancelled) return;
          if (result.error) {
            setErrorMessage(i18n.t('home.hubRankingWarning'));
            return;
          }
          hubScoresRef.current = result.scores;
          refreshHubSuggestions(cities, result.scores, preferred[0] ?? '');
          return;
        }

        // Restore last origins from this tab session so F5 does not flash Prague → nearby.
        const stored = resolveStoredOrigins(cities, readStoredOrigins());
        if (stored.length > 0) {
          setSelectedCodes(stored);
          defaultsInitializedRef.current = true;
          setLocating(false);

          const cachedScores = getCachedHubScores() ?? [];
          hubScoresRef.current = cachedScores;
          refreshHubSuggestions(cities, cachedScores, stored[0] ?? '');

          void scoresPromise.then(result => {
            if (cancelled || result.error) return;
            hubScoresRef.current = result.scores;
            refreshHubSuggestions(cities, result.scores, stored[0] ?? '');
          });
          return;
        }

        const cachedScores = getCachedHubScores();
        if (cachedScores && cachedScores.length > 0) {
          hubScoresRef.current = cachedScores;
          const defaults = selectDefaultCityCodes(cities, cachedScores);
          applyDefaults(cities, defaults, cachedScores);

          void scoresPromise.then(result => {
            if (cancelled || result.error) return;
            hubScoresRef.current = result.scores;
            refreshHubSuggestions(cities, result.scores, defaults[0] ?? '');
          });
          return;
        }

        // Keep locating=true until scores arrive so flights do not search provisional Prague first.
        const result = await scoresPromise;
        if (cancelled) return;
        if (result.error) {
          setErrorMessage(i18n.t('home.hubRankingWarning'));
          applyDefaults(cities, selectFallbackCityCodes(cities), []);
          return;
        }

        hubScoresRef.current = result.scores;
        applyDefaults(cities, selectDefaultCityCodes(cities, result.scores), result.scores);
      } catch {
        if (!cancelled) {
          setErrorMessage(i18n.t('home.apiError'));
          setLocating(false);
        }
      } finally {
        if (!cancelled && !defaultsInitializedRef.current) {
          setLocating(false);
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [preferredKey, refreshHubSuggestions, applyDefaults]);

  const citiesByCode = useMemo(() => indexCitiesByCode(allCities), [allCities]);

  return {
    allCities,
    citiesByCode,
    nearbyCities,
    selectedCodes,
    setSelectedCodes,
    localizeCityCodes,
    locating,
    errorMessage
  };
}
