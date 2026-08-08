import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from '../i18n';
import { getCities, getHubScores } from '../services/api';
import {
  findCityByCode,
  rankNearbyCities,
  rankPopularHubCities,
  selectDefaultCityCodes
} from '../services/locationPrefill';
import type { City, CityWithDistance, HubScore } from '../types/city';

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

export function useDeparturePrefill(options?: { preferredCodes?: string[] | null }) {
  const preferredKey = (options?.preferredCodes ?? [])
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

  useEffect(() => {
    if (allCities.length === 0 || !primaryCode) return;
    refreshHubSuggestions(allCities, hubScoresRef.current, primaryCode);
  }, [allCities, primaryCode, refreshHubSuggestions]);

  useEffect(() => {
    let cancelled = false;

    async function loadHubScoresInBackground(cities: City[], anchorCode: string) {
      try {
        const scores = await getHubScores();
        if (cancelled) return;
        hubScoresRef.current = scores;
        refreshHubSuggestions(cities, scores, anchorCode);
      } catch {
        if (!cancelled) {
          setErrorMessage(i18n.t('home.hubRankingWarning'));
        }
      }
    }

    async function init() {
      if (defaultsInitializedRef.current) return;

      try {
        const cities = await getCities();
        if (cancelled) return;
        setAllCities(cities);

        const preferred = preferredKey
          .split('|')
          .filter(code => Boolean(findCityByCode(cities, code)));

        // Prefer URL/prefill codes; otherwise pick defaults from cities only so the
        // From chip can render without waiting on hub scores.
        const defaults =
          preferred.length > 0 ? preferred : selectDefaultCityCodes(cities, hubScoresRef.current);
        if (defaults.length > 0) {
          setSelectedCodes(defaults);
        }
        defaultsInitializedRef.current = true;
        setLocating(false);

        void loadHubScoresInBackground(cities, defaults[0] ?? '');
      } catch {
        if (!cancelled) {
          setErrorMessage(i18n.t('home.apiError'));
          setLocating(false);
        }
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
