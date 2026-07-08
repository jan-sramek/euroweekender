import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFlightsForWeekends } from '../services/api';
import { filterFlightsByWeekends, type EveningFlightFilters } from '../services/weekendFilter';
import { filterFlightsByLegSelection, getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { getTripPrice, hasEnoughSeats } from '../utils/flightPrice';
import type { Flight } from '../types/flight';
import type { WeekendOption, WeekendPattern } from '../types/weekend';

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
  const flightLoadGeneration = useRef(0);
  const flightAbortController = useRef<AbortController | null>(null);

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

  const loadFlights = useCallback(async () => {
    const activeWeekendIds = selectedWeekendKey ? selectedWeekendKey.split('|') : [];
    const activeWeekends = weekends
      .filter(weekend => activeWeekendIds.includes(weekend.id))
      .sort((a, b) => a.departDate.getTime() - b.departDate.getTime());

    if (activeWeekends.length === 0 || selectedCodes.length === 0) return;

    flightAbortController.current?.abort();
    const controller = new AbortController();
    flightAbortController.current = controller;

    const generation = ++flightLoadGeneration.current;
    setLoadingFlights(true);
    setFlightError('');

    try {
      const items = await searchFlightsForWeekends(
        selectedCodes,
        activeWeekends.map(weekend => ({
          departFrom: weekend.departFrom,
          departTo: weekend.departTo
        })),
        controller.signal
      );
      if (generation !== flightLoadGeneration.current) return;
      setRawFlights(items);
      setDepartureLegFilter(null);
      setReturnLegFilter(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (generation !== flightLoadGeneration.current) return;
      setRawFlights([]);
      setFlightError(t('home.flightLoadError'));
    } finally {
      if (generation === flightLoadGeneration.current) {
        setLoadingFlights(false);
      }
    }
  }, [weekends, selectedWeekendKey, selectedCodes, selectedCodesKey, t]);

  useEffect(() => {
    if (locating) return;

    const timer = window.setTimeout(() => {
      void loadFlights();
    }, 400);

    return () => {
      window.clearTimeout(timer);
      flightAbortController.current?.abort();
    };
  }, [locating, loadFlights]);

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
