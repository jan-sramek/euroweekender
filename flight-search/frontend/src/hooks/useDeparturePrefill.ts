import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from '../i18n';
import { getCachedHubScores, getCities, getHubScores } from '../services/api';
import {
  findCityByCode,
  rankNearbyCities,
  rankPopularHubCities,
  selectDefaultCityCodes,
  selectFallbackCityCodes
} from '../services/locationPrefill';
import type { City, CityWithDistance, HubScore } from '../types/city';
import { useResolveCityDisplayNames } from './useResolveCityDisplayNames';

function updateHubSuggestions(
  cities: City[],
  scores: HubScore[],
  anchorCity: City
): { nearby: CityWithDistance[]; popular: CityWithDistance[] } {
  const anchor = { latitude: anchorCity.latitude, longitude: anchorCity.longitude };
  const nearby = rankNearbyCities(cities, anchor, scores);
  const popular = rankPopularHubCities(cities, anchor, scores, nearby);
  return { nearby, popular };
}

function sameCodeList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((code, index) => code.toUpperCase() === b[index]?.toUpperCase());
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
  const [allCities, setAllCities] = useState<City[]>([]);
  const [nearbyCities, setNearbyCities] = useState<CityWithDistance[]>([]);
  const [popularHubCities, setPopularHubCities] = useState<CityWithDistance[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() =>
    preferredKey ? preferredKey.split('|') : []
  );
  const [locating, setLocating] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const hubScoresRef = useRef<HubScore[]>([]);
  const defaultsInitializedRef = useRef(false);
  const provisionalDefaultsRef = useRef<string[] | null>(null);

  const refreshHubSuggestions = useCallback((cities: City[], scores: HubScore[], primaryCode: string) => {
    const anchorCity = findCityByCode(cities, primaryCode);
    if (!anchorCity) {
      setNearbyCities([]);
      setPopularHubCities([]);
      return;
    }

    const { nearby, popular } = updateHubSuggestions(cities, scores, anchorCity);
    setNearbyCities(nearby);
    setPopularHubCities(popular);
  }, []);

  const primaryCode = selectedCodes[0] ?? '';
  const codesToLocalize = [
    ...selectedCodes,
    ...(localizeKey ? localizeKey.split('|') : [])
  ];

  useResolveCityDisplayNames(allCities, setAllCities, codesToLocalize);

  useEffect(() => {
    if (allCities.length === 0 || !primaryCode) return;
    refreshHubSuggestions(allCities, hubScoresRef.current, primaryCode);
  }, [allCities, primaryCode, refreshHubSuggestions]);

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

        const cachedScores = getCachedHubScores();
        if (cachedScores && cachedScores.length > 0) {
          hubScoresRef.current = cachedScores;
          const defaults = selectDefaultCityCodes(cities, cachedScores);
          if (defaults.length > 0) {
            setSelectedCodes(defaults);
          }
          defaultsInitializedRef.current = true;
          setLocating(false);
          refreshHubSuggestions(cities, cachedScores, defaults[0] ?? '');

          void scoresPromise.then(result => {
            if (cancelled || result.error) return;
            hubScoresRef.current = result.scores;
            refreshHubSuggestions(cities, result.scores, defaults[0] ?? '');
          });
          return;
        }

        // Unlock immediately with static fallbacks, then refine once scores arrive.
        const provisional = selectFallbackCityCodes(cities);
        provisionalDefaultsRef.current = provisional;
        if (provisional.length > 0) {
          setSelectedCodes(provisional);
        }
        defaultsInitializedRef.current = true;
        setLocating(false);
        refreshHubSuggestions(cities, [], provisional[0] ?? '');

        const result = await scoresPromise;
        if (cancelled) return;
        if (result.error) {
          setErrorMessage(i18n.t('home.hubRankingWarning'));
          return;
        }

        hubScoresRef.current = result.scores;
        const refined = selectDefaultCityCodes(cities, result.scores);
        let anchorCode = provisional[0] ?? '';
        setSelectedCodes(current => {
          if (
            provisionalDefaultsRef.current &&
            sameCodeList(current, provisionalDefaultsRef.current)
          ) {
            provisionalDefaultsRef.current = null;
            anchorCode = refined[0] ?? anchorCode;
            return refined;
          }
          provisionalDefaultsRef.current = null;
          anchorCode = current[0] ?? anchorCode;
          return current;
        });
        refreshHubSuggestions(cities, result.scores, anchorCode);
      } catch {
        if (!cancelled) {
          setErrorMessage(i18n.t('home.apiError'));
        }
      } finally {
        if (!cancelled) setLocating(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [preferredKey, refreshHubSuggestions]);

  return {
    allCities,
    nearbyCities,
    popularHubCities,
    selectedCodes,
    setSelectedCodes,
    locating,
    errorMessage
  };
}
