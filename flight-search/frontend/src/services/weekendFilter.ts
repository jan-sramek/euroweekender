import type { Flight } from '../types/flight';
import type { WeekendOption, WeekendPattern } from '../types/weekend';
import {
  EVENING_DEPART_HOUR,
  getReturnDepartDate,
  isEveningDeparture
} from '../utils/flightLeg';
import { parseApiLocalDateTime } from '../utils/flightTime';

export interface EveningFlightFilters {
  outboundEvening: boolean;
  returnEvening: boolean;
}

export const NO_EVENING_FILTERS: EveningFlightFilters = {
  outboundEvening: false,
  returnEvening: false
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addHours(date: Date, hours: number): Date {
  const copy = new Date(date);
  copy.setTime(copy.getTime() + hours * 60 * 60 * 1000);
  return copy;
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Pattern outbound window: depart day + optional spill into the next morning (e.g. Fri + 3h Sat). */
function matchesOutboundWindow(depart: Date, weekend: WeekendOption): boolean {
  const anchor = startOfDay(weekend.departDate);
  const spillHours = weekend.outboundSpillHours;

  if (spillHours <= 0) {
    if (!sameCalendarDay(depart, anchor)) return false;
    if (depart.getDay() !== weekend.departWeekday) return false;
    if (weekend.eveningHour > 0) {
      return depart.getHours() * 60 + depart.getMinutes() >= weekend.eveningHour * 60;
    }
    return true;
  }

  const windowEnd = addHours(addDays(anchor, 1), spillHours);
  if (depart < anchor || depart >= windowEnd) {
    return false;
  }

  if (sameCalendarDay(depart, anchor)) {
    if (depart.getDay() !== weekend.departWeekday) return false;
    if (weekend.eveningHour > 0) {
      return depart.getHours() * 60 + depart.getMinutes() >= weekend.eveningHour * 60;
    }
    return true;
  }

  return sameCalendarDay(depart, addDays(anchor, 1));
}

function matchesReturnWindow(flight: Flight, weekend: WeekendOption): boolean {
  const returnDepart = flight.localReturnDeparture
    ? parseApiLocalDateTime(flight.localReturnDeparture)
    : getReturnDepartDate(flight);

  if (sameCalendarDay(returnDepart, weekend.returnDate)) {
    return true;
  }

  return returnDepart.getDay() === weekend.returnWeekday;
}

/** Any departure within the selected calendar week window. */
export function filterFlightsByWeekRange(flights: Flight[], weekend: WeekendOption): Flight[] {
  return flights.filter(flight => {
    const depart = parseApiLocalDateTime(flight.localDeparture);
    return depart >= weekend.departFrom && depart <= weekend.departTo;
  });
}

/** Match flights to a weekend pattern (outbound window + nights at destination + return day). */
export function matchesWeekendPattern(flight: Flight, weekend: WeekendOption): boolean {
  const depart = parseApiLocalDateTime(flight.localDeparture);

  if (!matchesOutboundWindow(depart, weekend)) {
    return false;
  }

  if (flight.nightsInDest !== weekend.nightsInDest) {
    return false;
  }

  return matchesReturnWindow(flight, weekend);
}

export function filterFlightsByWeekend(flights: Flight[], weekend: WeekendOption): Flight[] {
  return flights.filter(flight => matchesWeekendPattern(flight, weekend));
}

export function filterFlightsBySelection(
  flights: Flight[],
  weekend: WeekendOption,
  pattern: WeekendPattern | null,
  eveningFilters: EveningFlightFilters = NO_EVENING_FILTERS
): Flight[] {
  const byWeek = pattern ? filterFlightsByWeekend(flights, weekend) : filterFlightsByWeekRange(flights, weekend);
  return filterFlightsByEvening(byWeek, eveningFilters);
}

export function filterFlightsByWeekends(
  flights: Flight[],
  weekends: WeekendOption[],
  pattern: WeekendPattern | null,
  eveningFilters: EveningFlightFilters = NO_EVENING_FILTERS
): Flight[] {
  if (weekends.length === 0) return [];

  const seen = new Set<number>();
  const matched: Flight[] = [];

  for (const weekend of weekends) {
    for (const flight of filterFlightsBySelection(flights, weekend, pattern, eveningFilters)) {
      if (seen.has(flight.id)) continue;
      seen.add(flight.id);
      matched.push(flight);
    }
  }

  return matched;
}

export function filterFlightsByEvening(
  flights: Flight[],
  filters: EveningFlightFilters,
  eveningHour = EVENING_DEPART_HOUR
): Flight[] {
  if (!filters.outboundEvening && !filters.returnEvening) {
    return flights;
  }

  return flights.filter(flight => {
    if (filters.outboundEvening) {
      const outboundDepart = parseApiLocalDateTime(flight.localDeparture);
      if (!isEveningDeparture(outboundDepart, eveningHour)) {
        return false;
      }
    }

    if (filters.returnEvening) {
      const returnDepart = getReturnDepartDate(flight);
      if (!isEveningDeparture(returnDepart, eveningHour)) {
        return false;
      }
    }

    return true;
  });
}
