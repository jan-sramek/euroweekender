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

export function useDeparturePrefill() {
  const [allCities, setAllCities] = useState<City[]>([]);
  const [nearbyCities, setNearbyCities] = useState<CityWithDistance[]>([]);
  const [popularHubCities, setPopularHubCities] = useState<CityWithDistance[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
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

    async function init() {
      if (defaultsInitializedRef.current) return;

      try {
        const cities = await getCities();
        if (cancelled) return;
        setAllCities(cities);

        let scores = hubScoresRef.current;
        if (scores.length === 0) {
          try {
            scores = await getHubScores();
            hubScoresRef.current = scores;
          } catch {
            if (!cancelled) {
              setErrorMessage(i18n.t('home.hubRankingWarning'));
            }
          }
        }
        if (cancelled) return;

        const defaults = selectDefaultCityCodes(cities, scores);
        if (defaults.length > 0) {
          setSelectedCodes(defaults);
        }
        defaultsInitializedRef.current = true;
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
  }, []);

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
