import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFlightsForWeekends } from '../services/api';
import { filterFlightsByWeekends, type EveningFlightFilters } from '../services/weekendFilter';
import { filterFlightsByLegSelection, getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { getTripPrice, hasEnoughSeats } from '../utils/flightPrice';
import type { Flight } from '../types/flight';
import type { WeekendOption, WeekendPattern } from '../types/weekend';

const SEARCH_DEBOUNCE_MS = 800;

interface UseDestinationWeekendSearchOptions {
  fromCode: string | null;
  toCode: string | null;
  weekends: WeekendOption[];
  selectedWeekendId: string | null;
  selectedPattern: WeekendPattern | null;
  eveningFilters: EveningFlightFilters;
  passengerCount: number;
  locating: boolean;
}

export function useDestinationWeekendSearch({
  fromCode,
  toCode,
  weekends,
  selectedWeekendId,
  selectedPattern,
  eveningFilters,
  passengerCount,
  locating
}: UseDestinationWeekendSearchOptions) {
  const { t } = useTranslation();
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [rawFlights, setRawFlights] = useState<Flight[]>([]);
  const [departureLegFilter, setDepartureLegFilter] = useState<string | null>(null);
  const [returnLegFilter, setReturnLegFilter] = useState<string | null>(null);
  const [flightError, setFlightError] = useState('');
  const searchGeneration = useRef(0);

  const weekendKey = useMemo(
    () => weekends.map(weekend => weekend.id).join('|'),
    [weekends]
  );

  const searchKey = useMemo(() => {
    if (!fromCode || !toCode || !weekendKey) return '';
    return `${fromCode}|${toCode}|${weekendKey}`;
  }, [fromCode, toCode, weekendKey]);

  const filteredAll = useMemo(() => {
    if (weekends.length === 0) return [];
    return filterFlightsByWeekends(rawFlights, weekends, selectedPattern, eveningFilters)
      .filter(flight => hasEnoughSeats(flight, passengerCount))
      .sort((a, b) => getTripPrice(a, passengerCount) - getTripPrice(b, passengerCount));
  }, [rawFlights, weekends, selectedPattern, eveningFilters, passengerCount]);

  const pricesByWeekendId = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const weekend of weekends) {
      const weekendFlights = filterFlightsByWeekends(
        filteredAll,
        [weekend],
        selectedPattern,
        eveningFilters
      );
      if (weekendFlights.length === 0) {
        map.set(weekend.id, null);
        continue;
      }
      map.set(
        weekend.id,
        Math.min(...weekendFlights.map(flight => getTripPrice(flight, passengerCount)))
      );
    }
    return map;
  }, [weekends, filteredAll, selectedPattern, eveningFilters, passengerCount]);

  const selectedWeekend = useMemo(
    () => weekends.find(weekend => weekend.id === selectedWeekendId) ?? null,
    [weekends, selectedWeekendId]
  );

  const flights = useMemo(() => {
    if (!selectedWeekend) return [];
    return filterFlightsByWeekends(
      filteredAll,
      [selectedWeekend],
      selectedPattern,
      eveningFilters
    ).sort((a, b) => getTripPrice(a, passengerCount) - getTripPrice(b, passengerCount));
  }, [filteredAll, selectedWeekend, selectedPattern, eveningFilters, passengerCount]);

  const visibleFlights = useMemo(
    () => filterFlightsByLegSelection(flights, departureLegFilter, returnLegFilter),
    [flights, departureLegFilter, returnLegFilter]
  );

  const hasLegFilter = departureLegFilter !== null || returnLegFilter !== null;

  const runSearch = useCallback(
    async (
      origin: string,
      destination: string,
      activeWeekends: WeekendOption[],
      signal: AbortSignal
    ) => {
      const generation = ++searchGeneration.current;
      setLoadingFlights(true);
      setFlightError('');

      try {
        const items = await searchFlightsForWeekends(
          [origin],
          activeWeekends.map(weekend => ({
            departFrom: weekend.departFrom,
            departTo: weekend.departTo
          })),
          signal,
          destination,
          selectedPattern?.nightsInDest,
          partial => {
            if (generation !== searchGeneration.current) return;
            setRawFlights(partial);
            setLoadingFlights(false);
          }
        );
        if (generation !== searchGeneration.current) return;
        setRawFlights(items);
        setDepartureLegFilter(null);
        setReturnLegFilter(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (generation !== searchGeneration.current) return;
        setRawFlights([]);
        setFlightError(t('cheapestWeekend.flightLoadError'));
      } finally {
        if (generation === searchGeneration.current) {
          setLoadingFlights(false);
        }
      }
    },
    [t, selectedPattern]
  );

  const loadFlights = useCallback(async () => {
    if (!fromCode || !toCode || weekends.length === 0) return;
    await runSearch(fromCode, toCode, weekends, new AbortController().signal);
  }, [runSearch, fromCode, toCode, weekends]);

  useEffect(() => {
    if (locating || !searchKey || !fromCode || !toCode || weekends.length === 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void runSearch(fromCode, toCode, weekends, controller.signal);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      searchGeneration.current += 1;
    };
  }, [locating, searchKey, fromCode, toCode, weekends, runSearch]);

  const handleDepartureLegSelect = (flight: Flight, selected: boolean) => {
    setDepartureLegFilter(selected ? getDepartureLegKey(flight) : null);
  };

  const handleReturnLegSelect = (flight: Flight, selected: boolean) => {
    setReturnLegFilter(selected ? getReturnLegKey(flight) : null);
  };

  const clearLegFilters = () => {
    setDepartureLegFilter(null);
    setReturnLegFilter(null);
  };

  return {
    flights,
    visibleFlights,
    pricesByWeekendId,
    loadingFlights,
    flightError,
    hasLegFilter,
    loadFlights,
    handleDepartureLegSelect,
    handleReturnLegSelect,
    clearLegFilters,
    departureLegFilter,
    returnLegFilter,
    selectedWeekend
  };
}
