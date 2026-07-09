import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from '../i18n';
import { getCities, getHubScores } from '../services/api';
import { rankNearbyCities, rankPopularHubCities } from '../services/locationPrefill';
import type { City, CityWithDistance, HubScore } from '../types/city';

const FALLBACK_CODES = ['PRG', 'VIE', 'BER', 'MUC', 'LON', 'BCN'];
const DEFAULT_SELECTED_CITIES = 5;

function takeTopCityCodes(orderedCodes: string[], count = DEFAULT_SELECTED_CITIES): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const code of orderedCodes) {
    const normalized = code.trim().toUpperCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalized);
    if (unique.length >= count) break;
  }

  return unique;
}

function selectDefaultCityCodes(cities: City[]): string[] {
  const fallbackCodes = FALLBACK_CODES.filter(code => cities.some(city => city.code === code));
  const defaults = takeTopCityCodes(fallbackCodes);
  if (defaults.length > 0) return defaults;
  return cities[0] ? [cities[0].code] : [];
}

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
    const anchorCity = cities.find(city => city.code === primaryCode);
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

        const defaults = selectDefaultCityCodes(cities);
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
