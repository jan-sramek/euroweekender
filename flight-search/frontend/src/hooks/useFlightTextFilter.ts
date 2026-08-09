import { useEffect, useMemo, useState, useDeferredValue } from 'react';
import type { Flight } from '../types/flight';
import { filterFlightsByTextQuery } from '../utils/flightTextSearch';

export function useFlightTextFilter(flights: Flight[], resetKey = '') {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery('');
  }, [resetKey]);

  const filteredFlights = useMemo(
    () => filterFlightsByTextQuery(flights, deferredQuery),
    [flights, deferredQuery]
  );

  const hasTextFilter = deferredQuery.trim().length > 0;

  return {
    query,
    setQuery,
    filteredFlights,
    hasTextFilter
  };
}
