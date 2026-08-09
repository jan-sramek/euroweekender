import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFlightsForWeekends } from '../services/api';
import { filterFlightsByDayTrip, type DayTripOption } from '../services/dayTrip';
import { filterFlightsByLegSelection } from '../utils/flightLeg';
import { getTripPrice, hasEnoughSeats } from '../utils/flightPrice';
import type { Flight } from '../types/flight';

const SEARCH_DEBOUNCE_MS = 800;

interface UseDayTripSearchOptions {
  selectedCodes: string[];
  days: DayTripOption[];
  selectedDayIds: string[];
  passengerCount: number;
  locating: boolean;
}

export function useDayTripSearch({
  selectedCodes,
  days,
  selectedDayIds,
  passengerCount,
  locating
}: UseDayTripSearchOptions) {
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

  const selectedDays = useMemo(
    () =>
      days
        .filter(day => selectedDayIds.includes(day.id))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [days, selectedDayIds]
  );

  const selectedDayKey = useMemo(
    () => selectedDayIds.slice().sort().join('|'),
    [selectedDayIds]
  );

  const searchKey = useMemo(() => {
    if (!selectedCodesKey || !selectedDayKey) return '';
    return `${selectedCodesKey}|${selectedDayKey}`;
  }, [selectedCodesKey, selectedDayKey]);

  const flights = useMemo(() => {
    if (selectedDays.length === 0) return [];
    return filterFlightsByDayTrip(rawFlights, selectedDays)
      .filter(flight => hasEnoughSeats(flight, passengerCount))
      .sort((a, b) => getTripPrice(a, passengerCount) - getTripPrice(b, passengerCount));
  }, [rawFlights, selectedDays, passengerCount]);

  const visibleFlights = useMemo(
    () => filterFlightsByLegSelection(flights, departureLegFilter, returnLegFilter),
    [flights, departureLegFilter, returnLegFilter]
  );

  const hasLegFilter = departureLegFilter !== null || returnLegFilter !== null;

  const runSearch = useCallback(
    async (codes: string[], activeDays: DayTripOption[], signal: AbortSignal) => {
      const generation = ++searchGeneration.current;
      setLoadingFlights(true);
      setFlightError('');
      setDepartureLegFilter(null);
      setReturnLegFilter(null);

      try {
        const results = await searchFlightsForWeekends(
          codes,
          activeDays.map(day => ({ departFrom: day.departFrom, departTo: day.departTo })),
          signal
        );
        if (signal.aborted || generation !== searchGeneration.current) return;
        setRawFlights(results);
      } catch (error) {
        if (signal.aborted || generation !== searchGeneration.current) return;
        setRawFlights([]);
        setFlightError(t('home.flightLoadError'));
        console.error(error);
      } finally {
        if (!signal.aborted && generation === searchGeneration.current) {
          setLoadingFlights(false);
        }
      }
    },
    [t]
  );

  const loadFlights = useCallback(() => {
    if (selectedCodes.length === 0 || selectedDays.length === 0) return;
    void runSearch(selectedCodes, selectedDays, new AbortController().signal);
  }, [runSearch, selectedCodes, selectedDays]);

  useEffect(() => {
    if (locating || !searchKey) {
      setRawFlights([]);
      setLoadingFlights(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void runSearch(selectedCodes, selectedDays, controller.signal);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locating, searchKey, selectedCodes, selectedDays, runSearch]);

  return {
    selectedDays,
    flights,
    visibleFlights,
    loadingFlights,
    flightError,
    hasLegFilter,
    loadFlights,
    handleDepartureLegSelect: setDepartureLegFilter,
    handleReturnLegSelect: setReturnLegFilter,
    clearLegFilters: () => {
      setDepartureLegFilter(null);
      setReturnLegFilter(null);
    },
    departureLegFilter,
    returnLegFilter
  };
}
