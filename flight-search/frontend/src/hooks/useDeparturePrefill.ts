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
const NEARBY_FALLBACK_LIMIT = 12;

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

/** When GPS/IP is unavailable, still show useful departure chips from hub ranking. */
function nearbyFromHubScores(
  cities: City[],
  scores: HubScore[],
  excludeCode?: string,
  limit = NEARBY_FALLBACK_LIMIT
): CityWithDistance[] {
  const excluded = (excludeCode ?? '').trim().toUpperCase();
  const byCode = indexCitiesByCode(cities);

  return [...scores]
    .filter(score => {
      const code = score.code.trim().toUpperCase();
      return Boolean(code && code !== excluded && byCode.has(code) && (score.offerCount ?? 0) > 0);
    })
    .sort((a, b) => {
      if (b.offerCount !== a.offerCount) return b.offerCount - a.offerCount;
      return (a.minPrice ?? Number.POSITIVE_INFINITY) - (b.minPrice ?? Number.POSITIVE_INFINITY);
    })
    .slice(0, limit)
    .map(score => {
      const city = byCode.get(score.code.trim().toUpperCase())!;
      return {
        ...city,
        distanceKm: 0,
        hubScore: score.hubScore ?? 0,
        effectiveScore: score.hubScore ?? 0,
        offerCount: score.offerCount ?? 0,
        minPrice: score.minPrice ?? null
      };
    });
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
  const allCitiesRef = useRef<City[]>([]);
  allCitiesRef.current = allCities;

  const refreshHubSuggestions = useCallback((cities: City[], scores: HubScore[], primaryCode: string) => {
    const anchorCity = findCityByCode(cities, primaryCode);
    if (!anchorCity) {
      setNearbyCities([]);
      return;
    }

    setNearbyCities(updateNearbySuggestions(cities, scores, anchorCity));
  }, []);

  const applyNearbyForInbound = useCallback(
    (cities: City[], scores: HubScore[], position: GeoPosition | null) => {
      if (position) {
        setNearbyCities(nearbyFromPosition(cities, scores, position, excludeNearbyCode));
        return;
      }
      setNearbyCities(nearbyFromHubScores(cities, scores, excludeNearbyCode));
    },
    [excludeNearbyCode]
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

  const nearbyPrimaryCode = nearbyAnchorCode || selectedCodes[0] || '';

  useResolveCityDisplayNames(
    allCities,
    setAllCities,
    [...selectedCodes, ...(localizeKey ? localizeKey.split('|') : [])],
    extraLocalizeCodes,
    locale
  );

  useEffect(() => {
    if (allCities.length === 0 || disableAutoSelect) return;
    if (!nearbyPrimaryCode) return;
    refreshHubSuggestions(allCities, hubScoresRef.current, nearbyPrimaryCode);
  }, [allCities, nearbyPrimaryCode, disableAutoSelect, refreshHubSuggestions]);

  // Inbound hubs: GPS nearby (with hub-score fallback). Own effect so init cleanup cannot strand it.
  useEffect(() => {
    if (!disableAutoSelect || allCities.length === 0) return;

    let cancelled = false;
    const citiesSnapshot = allCities;

    void (async () => {
      try {
        const scores =
          hubScoresRef.current.length > 0
            ? hubScoresRef.current
            : await getHubScores().catch(() => [] as HubScore[]);
        if (cancelled) return;
        hubScoresRef.current = scores;

        const position = userPositionRef.current ?? (await resolveUserPosition());
        if (cancelled) return;
        userPositionRef.current = position;
        applyNearbyForInbound(citiesSnapshot, scores, position);
      } catch {
        if (!cancelled) {
          applyNearbyForInbound(citiesSnapshot, hubScoresRef.current, null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when catalog arrives / exclude changes
  }, [disableAutoSelect, allCities.length, excludeNearbyCode, applyNearbyForInbound]);

  useEffect(() => {
    if (preferredKey || disableAutoSelect || allCities.length === 0) return;
    if (selectedCodes.length === 0) return;
    writeStoredOrigins(selectedCodes);
  }, [selectedCodes, preferredKey, disableAutoSelect, allCities.length]);

  // Keep preferred selection in sync when the URL city changes.
  useEffect(() => {
    if (!preferredKey) return;
    setSelectedCodes(preferredKey.split('|'));
  }, [preferredKey]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLocating(true);
      setErrorMessage('');

      const scoresPromise = getHubScores().then(
        scores => ({ scores, error: false as const }),
        () => ({ scores: [] as HubScore[], error: true as const })
      );
      const storedHint = preferredKey || disableAutoSelect ? null : readStoredOrigins();
      const positionPromise =
        !preferredKey && !disableAutoSelect && !(storedHint && storedHint.length > 0)
          ? resolveUserPosition()
          : null;

      try {
        const cities = await getCities();
        if (cancelled) return;
        setAllCities(cities);
        allCitiesRef.current = cities;

        const preferred = preferredKey
          .split('|')
          .filter(code => Boolean(findCityByCode(cities, code)));

        if (preferred.length > 0) {
          setSelectedCodes(preferred);
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
          setSelectedCodes([]);
          setLocating(false);
          // Keep hub scores warm for the inbound nearby effect; never leave nearby stranded.
          void scoresPromise.then(result => {
            if (cancelled) return;
            if (!result.error) {
              hubScoresRef.current = result.scores;
            }
            const position = userPositionRef.current;
            applyNearbyForInbound(
              cities,
              hubScoresRef.current,
              position
            );
          });
          return;
        }

        const stored = resolveStoredOrigins(cities, readStoredOrigins());
        if (stored.length > 0) {
          setSelectedCodes(stored);
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
          setSelectedCodes(defaults);
          setLocating(false);
          refreshHubSuggestions(cities, cachedScores, defaults[0] ?? nearbyAnchorCode);
          writeStoredOrigins(defaults);

          void scoresPromise.then(result => {
            if (cancelled || result.error) return;
            hubScoresRef.current = result.scores;
            refreshHubSuggestions(cities, result.scores, defaults[0] ?? nearbyAnchorCode);
          });
          return;
        }

        const result = await scoresPromise;
        if (cancelled) return;
        if (result.error) {
          setErrorMessage(i18n.t('home.hubRankingWarning'));
          const defaults = selectDefaultCityCodesFromPosition(cities, [], position);
          setSelectedCodes(defaults);
          setLocating(false);
          refreshHubSuggestions(cities, [], defaults[0] ?? nearbyAnchorCode);
          writeStoredOrigins(defaults);
          return;
        }

        hubScoresRef.current = result.scores;
        const defaults = selectDefaultCityCodesFromPosition(cities, result.scores, position);
        setSelectedCodes(defaults);
        setLocating(false);
        refreshHubSuggestions(cities, result.scores, defaults[0] ?? nearbyAnchorCode);
        writeStoredOrigins(defaults);
      } catch {
        if (!cancelled) {
          setErrorMessage(i18n.t('home.apiError'));
          setLocating(false);
        }
      } finally {
        if (!cancelled) {
          setLocating(false);
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
    // Intentionally narrow deps: callback identity changes must not cancel city loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyNearbyForInbound used only after cities settle
  }, [preferredKey, disableAutoSelect, nearbyAnchorCode, refreshHubSuggestions]);

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
