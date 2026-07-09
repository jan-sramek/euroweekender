import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from '../i18n';
import { getCities, getHubScores } from '../services/api';
import { getCurrentPosition, type GeoPosition } from '../services/geolocation';
import { rankNearbyCities } from '../services/locationPrefill';
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

function selectDefaultCityCodes(nearby: CityWithDistance[], cities: City[]): string[] {
  const nearbyCodes = nearby.map(city => city.code);
  if (nearbyCodes.length >= DEFAULT_SELECTED_CITIES) {
    return takeTopCityCodes(nearbyCodes);
  }

  const fallbackCodes = FALLBACK_CODES.filter(code => cities.some(city => city.code === code));
  return takeTopCityCodes([...nearbyCodes, ...fallbackCodes]);
}

export function useDeparturePrefill() {
  const [allCities, setAllCities] = useState<City[]>([]);
  const [nearbyCities, setNearbyCities] = useState<CityWithDistance[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [locating, setLocating] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const hubScoresRef = useRef<HubScore[]>([]);
  const geoAnchorRef = useRef<GeoPosition | null>(null);
  const locationInitializedRef = useRef(false);

  const applyNearbyRanking = useCallback(
    (cities: City[], scores: HubScore[], anchor: GeoPosition): CityWithDistance[] => {
      hubScoresRef.current = scores;
      geoAnchorRef.current = anchor;
      const nearby = rankNearbyCities(cities, anchor, scores);
      setNearbyCities(nearby);
      return nearby;
    },
    []
  );

  const applyFallbackDeparture = useCallback(
    (cities: City[], scores: HubScore[], position?: GeoPosition) => {
      const matches = FALLBACK_CODES.map(code => cities.find(c => c.code === code)).filter(
        (c): c is City => c !== undefined
      );
      const fallback = matches[0] ?? cities[0];
      if (!fallback) return;

      const anchor = position ?? { latitude: fallback.latitude, longitude: fallback.longitude };
      const nearby = applyNearbyRanking(cities, scores, anchor);

      if (nearby.length === 0) {
        setNearbyCities([
          {
            ...fallback,
            distanceKm: 0,
            hubScore: 0,
            effectiveScore: 0,
            offerCount: 0,
            minPrice: null
          }
        ]);
      }

      if (!locationInitializedRef.current) {
        setSelectedCodes(selectDefaultCityCodes(nearby, cities));
        locationInitializedRef.current = true;
      }
    },
    [applyNearbyRanking]
  );

  const prefillLocation = useCallback(
    async (cities: City[], scores: HubScore[]) => {
      hubScoresRef.current = scores;

      const position = (await getCurrentPosition()) ?? geoAnchorRef.current;

      if (position && cities.length > 0) {
        geoAnchorRef.current = position;
        const nearby = applyNearbyRanking(cities, scores, position);
        if (nearby.length > 0) {
          if (!locationInitializedRef.current) {
            setSelectedCodes(selectDefaultCityCodes(nearby, cities));
            locationInitializedRef.current = true;
          }
          return;
        }
      }

      applyFallbackDeparture(cities, scores, position ?? undefined);
    },
    [applyFallbackDeparture, applyNearbyRanking]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (locationInitializedRef.current) return;

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

        await prefillLocation(cities, scores);
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
  }, [prefillLocation]);

  return {
    allCities,
    nearbyCities,
    selectedCodes,
    setSelectedCodes,
    locating,
    errorMessage
  };
}
