import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import i18n from '../i18n';
import { getCachedHubScores, getCities, getHubScores } from '../services/api';
import { resolveUserPosition, type GeoPosition } from '../services/geolocation';
import {
  findCityByCode,
  rankNearbyCities,
  selectDefaultCityCodesFromPosition
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
  const anchorCode = anchorCity.code.toUpperCase();
  return rankNearbyCities(cities, anchor, scores).filter(
    city => city.code.toUpperCase() !== anchorCode
  );
}

function nearbyFromPosition(
  cities: City[],
  scores: HubScore[],
  position: GeoPosition,
  excludeCode?: string
): CityWithDistance[] {
  const excluded = (excludeCode ?? '').trim().toUpperCase();
  return rankNearbyCities(cities, position, scores).filter(
    city => !excluded || city.code.toUpperCase() !== excluded
  );
}

function resolveStoredOrigins(cities: City[], stored: string[] | null): string[] {
  if (!stored || stored.length === 0) return [];
  return stored.filter(code => Boolean(findCityByCode(cities, code)));
}

export function useDeparturePrefill(options?: {
  preferredCodes?: string[] | null;
  /** Extra city codes to localize for the active UI language (e.g. destination). */
  localizeCodes?: string[] | null;
  /** Skip GPS/session defaults — used on inbound destination hubs. */
  disableAutoSelect?: boolean;
  /** Anchor nearby suggestions on this city when no origin is selected. */
  nearbyAnchorCode?: string | null;
  /** Exclude this city from nearby suggestions (e.g. the destination on inbound hubs). */
  excludeNearbyCode?: string | null;
}) {
  const preferredKey = (options?.preferredCodes ?? [])
    .map(code => code.trim().toUpperCase())
    .filter(Boolean)
    .join('|');
  const localizeKey = (options?.localizeCodes ?? [])
    .map(code => code.trim().toUpperCase())
    .filter(Boolean)
    .join('|');
  const disableAutoSelect = Boolean(options?.disableAutoSelect);
  const nearbyAnchorCode = (options?.nearbyAnchorCode ?? '').trim().toUpperCase();
  const excludeNearbyCode = (options?.excludeNearbyCode ?? '').trim().toUpperCase();
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
  const userPositionRef = useRef<GeoPosition | null>(null);
  const defaultsInitializedRef = useRef(false);

  const refreshHubSuggestions = useCallback((cities: City[], scores: HubScore[], primaryCode: string) => {
    const anchorCity = findCityByCode(cities, primaryCode);
    if (!anchorCity) {
      setNearbyCities([]);
      return;
    }

    setNearbyCities(updateNearbySuggestions(cities, scores, anchorCity));
  }, []);

  const refreshNearbyFromUserPosition = useCallback(
    (cities: City[], scores: HubScore[], position: GeoPosition | null) => {
      if (!position) {
        setNearbyCities([]);
        return;
      }
      setNearbyCities(nearbyFromPosition(cities, scores, position, excludeNearbyCode));
    },
    [excludeNearbyCode]
  );

  const applyDefaults = useCallback(
    (cities: City[], codes: string[], scores: HubScore[]) => {
      setSelectedCodes(codes);
      defaultsInitializedRef.current = true;
      setLocating(false);
      refreshHubSuggestions(cities, scores, codes[0] ?? nearbyAnchorCode);
      if (!disableAutoSelect) {
        writeStoredOrigins(codes);
      }
    },
    [refreshHubSuggestions, disableAutoSelect, nearbyAnchorCode]
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

  /** Prefer the page-city anchor when set; otherwise the first selected origin. */
  const nearbyPrimaryCode = nearbyAnchorCode || selectedCodes[0] || '';

  useResolveCityDisplayNames(
    allCities,
    setAllCities,
    [...selectedCodes, ...(localizeKey ? localizeKey.split('|') : [])],
    extraLocalizeCodes,
    locale
  );

  useEffect(() => {
    if (allCities.length === 0) return;

    // Inbound hubs: keep nearby tied to the user's location, never auto-selected origins.
    if (disableAutoSelect) {
      refreshNearbyFromUserPosition(allCities, hubScoresRef.current, userPositionRef.current);
      return;
    }

    if (!nearbyPrimaryCode) return;
    refreshHubSuggestions(allCities, hubScoresRef.current, nearbyPrimaryCode);
  }, [
    allCities,
    nearbyPrimaryCode,
    disableAutoSelect,
    refreshHubSuggestions,
    refreshNearbyFromUserPosition
  ]);

  useEffect(() => {
    if (!defaultsInitializedRef.current || preferredKey || disableAutoSelect) return;
    writeStoredOrigins(selectedCodes);
  }, [selectedCodes, preferredKey, disableAutoSelect]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (defaultsInitializedRef.current) return;

      const scoresPromise = getHubScores().then(
        scores => ({ scores, error: false as const }),
        () => ({ scores: [] as HubScore[], error: true as const })
      );
      const storedHint = preferredKey || disableAutoSelect ? null : readStoredOrigins();
      const positionPromise =
        !preferredKey && !(storedHint && storedHint.length > 0)
          ? resolveUserPosition()
          : null;

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
          refreshHubSuggestions(cities, result.scores, preferred[0] ?? nearbyAnchorCode);
          return;
        }

        if (disableAutoSelect) {
          defaultsInitializedRef.current = true;
          const position = await (positionPromise ?? resolveUserPosition());
          if (cancelled) return;
          userPositionRef.current = position;

          const result = await scoresPromise;
          if (cancelled) return;
          const scores = result.error ? [] : result.scores;
          if (result.error) {
            setErrorMessage(i18n.t('home.hubRankingWarning'));
          } else {
            hubScoresRef.current = scores;
          }
          refreshNearbyFromUserPosition(cities, scores, position);
          setLocating(false);
          return;
        }

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

        const position = await (positionPromise ?? resolveUserPosition());
        if (cancelled) return;
        userPositionRef.current = position;

        const cachedScores = getCachedHubScores();
        if (cachedScores && cachedScores.length > 0) {
          hubScoresRef.current = cachedScores;
          const defaults = selectDefaultCityCodesFromPosition(cities, cachedScores, position);
          applyDefaults(cities, defaults, cachedScores);

          void scoresPromise.then(result => {
            if (cancelled || result.error) return;
            hubScoresRef.current = result.scores;
            refreshHubSuggestions(cities, result.scores, defaults[0] ?? '');
          });
          return;
        }

        const result = await scoresPromise;
        if (cancelled) return;
        if (result.error) {
          setErrorMessage(i18n.t('home.hubRankingWarning'));
          applyDefaults(cities, selectDefaultCityCodesFromPosition(cities, [], position), []);
          return;
        }

        hubScoresRef.current = result.scores;
        applyDefaults(
          cities,
          selectDefaultCityCodesFromPosition(cities, result.scores, position),
          result.scores
        );
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
  }, [
    preferredKey,
    refreshHubSuggestions,
    refreshNearbyFromUserPosition,
    applyDefaults,
    disableAutoSelect,
    nearbyAnchorCode
  ]);

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
