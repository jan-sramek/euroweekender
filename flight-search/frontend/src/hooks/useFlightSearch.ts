import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFlightsForWeekends } from '../services/api';
import { filterFlightsByWeekends, type EveningFlightFilters } from '../services/weekendFilter';
import { filterFlightsByLegSelection, getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { getTripPrice, hasEnoughSeats } from '../utils/flightPrice';
import type { Flight } from '../types/flight';
import type { WeekendOption, WeekendPattern } from '../types/weekend';

const SEARCH_DEBOUNCE_MS = 800;

interface UseFlightSearchOptions {
  selectedCodes: string[];
  weekends: WeekendOption[];
  selectedWeekendIds: string[];
  selectedPattern: WeekendPattern | null;
  eveningFilters: EveningFlightFilters;
  passengerCount: number;
  locating: boolean;
}

export function useFlightSearch({
  selectedCodes,
  weekends,
  selectedWeekendIds,
  selectedPattern,
  eveningFilters,
  passengerCount,
  locating
}: UseFlightSearchOptions) {
  const { t } = useTranslation();
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [rawFlights, setRawFlights] = useState<Flight[]>([]);
  const [departureLegFilter, setDepartureLegFilter] = useState<string | null>(null);
  const [returnLegFilter, setReturnLegFilter] = useState<string | null>(null);
  const [flightError, setFlightError] = useState('');
  const searchGeneration = useRef(0);

  const selectedCodesKey = useMemo(
    () => selectedCodes.slice().sort().join(','),
    [selectedCodes]
  );

  const selectedWeekends = useMemo(
    () =>
      weekends
        .filter(weekend => selectedWeekendIds.includes(weekend.id))
        .sort((a, b) => a.departDate.getTime() - b.departDate.getTime()),
    [weekends, selectedWeekendIds]
  );

  const selectedWeekendKey = useMemo(
    () => selectedWeekendIds.slice().sort().join('|'),
    [selectedWeekendIds]
  );

  const searchKey = useMemo(() => {
    if (!selectedCodesKey || !selectedWeekendKey) return '';
    return `${selectedCodesKey}|${selectedWeekendKey}`;
  }, [selectedCodesKey, selectedWeekendKey]);

  const flights = useMemo(() => {
    if (selectedWeekends.length === 0) return [];
    const matched = filterFlightsByWeekends(rawFlights, selectedWeekends, selectedPattern, eveningFilters);
    return matched
      .filter(flight => hasEnoughSeats(flight, passengerCount))
      .sort((a, b) => getTripPrice(a, passengerCount) - getTripPrice(b, passengerCount));
  }, [rawFlights, selectedWeekends, selectedPattern, eveningFilters, passengerCount]);

  const visibleFlights = useMemo(
    () => filterFlightsByLegSelection(flights, departureLegFilter, returnLegFilter),
    [flights, departureLegFilter, returnLegFilter]
  );

  const hasLegFilter = departureLegFilter !== null || returnLegFilter !== null;

  const runSearch = useCallback(
    async (codes: string[], activeWeekends: WeekendOption[], signal: AbortSignal) => {
      const generation = ++searchGeneration.current;
      setLoadingFlights(true);
      setFlightError('');

      try {
        const items = await searchFlightsForWeekends(
          codes,
          activeWeekends.map(weekend => ({
            departFrom: weekend.departFrom,
            departTo: weekend.departTo
          })),
          signal
        );
        if (generation !== searchGeneration.current) return;
        setRawFlights(items);
        setDepartureLegFilter(null);
        setReturnLegFilter(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (generation !== searchGeneration.current) return;
        setRawFlights([]);
        setFlightError(t('home.flightLoadError'));
      } finally {
        if (generation === searchGeneration.current) {
          setLoadingFlights(false);
        }
      }
    },
    [t]
  );

  const loadFlights = useCallback(async () => {
    if (!searchKey || selectedWeekends.length === 0) return;
    await runSearch(selectedCodesKey.split(','), selectedWeekends, new AbortController().signal);
  }, [runSearch, searchKey, selectedCodesKey, selectedWeekends]);

  useEffect(() => {
    if (locating || !searchKey || selectedWeekends.length === 0) return;

    const controller = new AbortController();
    const codes = selectedCodesKey.split(',');
    const activeWeekends = selectedWeekends;

    const timer = window.setTimeout(() => {
      void runSearch(codes, activeWeekends, controller.signal);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      searchGeneration.current += 1;
    };
  }, [locating, searchKey, selectedCodesKey, selectedWeekends, runSearch]);

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
    selectedWeekends,
    flights,
    visibleFlights,
    loadingFlights,
    flightError,
    hasLegFilter,
    loadFlights,
    handleDepartureLegSelect,
    handleReturnLegSelect,
    clearLegFilters,
    departureLegFilter,
    returnLegFilter
  };
}
