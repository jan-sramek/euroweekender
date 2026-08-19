import type { Flight } from '../types/flight';
import type { WeekendOption, WeekendPattern } from '../types/weekend';
import { alignWeekendToPattern } from './weekend';
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

export interface WeekendFlightIndex {
  flights: Flight[];
  byWeekendId: Map<string, Flight[]>;
}

interface RangeWindow {
  kind: 'range';
  weekendId: string;
  departFrom: number;
  departTo: number;
}

interface PatternWindow {
  kind: 'pattern';
  weekendId: string;
  nightsInDest: number;
  departWeekday: number;
  returnWeekday: number;
  eveningMinute: number;
  spillHours: number;
  anchorTime: number;
  windowEndTime: number;
  anchorYear: number;
  anchorMonth: number;
  anchorDate: number;
  nextYear: number;
  nextMonth: number;
  nextDate: number;
  returnYear: number;
  returnMonth: number;
  returnDate: number;
}

type MatchWindow = RangeWindow | PatternWindow;

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

function sameYmd(
  date: Date,
  year: number,
  month: number,
  day: number
): boolean {
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

/** Pattern outbound window: depart day + optional spill into the next morning (e.g. Fri + 3h Sat). */
function matchesOutboundWindow(depart: Date, weekend: WeekendOption): boolean {
  const window = toPatternWindow(weekend.id, weekend);
  return matchesPatternOutbound(depart, window);
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

function toRangeWindow(weekend: WeekendOption): RangeWindow {
  return {
    kind: 'range',
    weekendId: weekend.id,
    departFrom: weekend.departFrom.getTime(),
    departTo: weekend.departTo.getTime()
  };
}

function toPatternWindow(weekendId: string, aligned: WeekendOption): PatternWindow {
  const anchor = startOfDay(aligned.departDate);
  const next = addDays(anchor, 1);
  const spillHours = aligned.outboundSpillHours;

  return {
    kind: 'pattern',
    weekendId,
    nightsInDest: aligned.nightsInDest,
    departWeekday: aligned.departWeekday,
    returnWeekday: aligned.returnWeekday,
    eveningMinute: aligned.eveningHour * 60,
    spillHours,
    anchorTime: anchor.getTime(),
    windowEndTime: addHours(next, spillHours).getTime(),
    anchorYear: anchor.getFullYear(),
    anchorMonth: anchor.getMonth(),
    anchorDate: anchor.getDate(),
    nextYear: next.getFullYear(),
    nextMonth: next.getMonth(),
    nextDate: next.getDate(),
    returnYear: aligned.returnDate.getFullYear(),
    returnMonth: aligned.returnDate.getMonth(),
    returnDate: aligned.returnDate.getDate()
  };
}

function buildMatchWindows(
  weekends: WeekendOption[],
  patterns: readonly WeekendPattern[]
): MatchWindow[] {
  if (patterns.length === 0) {
    return weekends.map(toRangeWindow);
  }

  const windows: MatchWindow[] = [];
  for (const weekend of weekends) {
    for (const pattern of patterns) {
      const aligned =
        weekend.patternId === pattern.id ? weekend : alignWeekendToPattern(weekend, pattern);
      windows.push(toPatternWindow(weekend.id, aligned));
    }
  }
  return windows;
}

function matchesPatternOutbound(depart: Date, window: PatternWindow): boolean {
  if (window.spillHours <= 0) {
    if (!sameYmd(depart, window.anchorYear, window.anchorMonth, window.anchorDate)) return false;
    if (depart.getDay() !== window.departWeekday) return false;
    if (window.eveningMinute > 0) {
      return depart.getHours() * 60 + depart.getMinutes() >= window.eveningMinute;
    }
    return true;
  }

  const departTime = depart.getTime();
  if (departTime < window.anchorTime || departTime >= window.windowEndTime) {
    return false;
  }

  if (sameYmd(depart, window.anchorYear, window.anchorMonth, window.anchorDate)) {
    if (depart.getDay() !== window.departWeekday) return false;
    if (window.eveningMinute > 0) {
      return depart.getHours() * 60 + depart.getMinutes() >= window.eveningMinute;
    }
    return true;
  }

  return sameYmd(depart, window.nextYear, window.nextMonth, window.nextDate);
}

function matchesPatternWindow(
  depart: Date,
  returnDepart: Date,
  nightsInDest: number,
  window: PatternWindow
): boolean {
  if (nightsInDest !== window.nightsInDest) return false;
  if (!matchesPatternOutbound(depart, window)) return false;
  if (sameYmd(returnDepart, window.returnYear, window.returnMonth, window.returnDate)) {
    return true;
  }
  return returnDepart.getDay() === window.returnWeekday;
}

function matchesWindow(
  depart: Date,
  returnDepart: Date | null,
  nightsInDest: number,
  window: MatchWindow,
  getReturnDepart: () => Date
): boolean {
  if (window.kind === 'range') {
    const departTime = depart.getTime();
    return departTime >= window.departFrom && departTime <= window.departTo;
  }

  return matchesPatternWindow(depart, returnDepart ?? getReturnDepart(), nightsInDest, window);
}

/** Any departure within the selected calendar week window. */
export function filterFlightsByWeekRange(flights: Flight[], weekend: WeekendOption): Flight[] {
  const window = toRangeWindow(weekend);
  return flights.filter(flight => {
    const depart = parseApiLocalDateTime(flight.localDeparture);
    const departTime = depart.getTime();
    return departTime >= window.departFrom && departTime <= window.departTo;
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
  patterns: readonly WeekendPattern[],
  eveningFilters: EveningFlightFilters = NO_EVENING_FILTERS
): Flight[] {
  return filterFlightsByWeekends(flights, [weekend], patterns, eveningFilters);
}

/** One pass over flights: union matches plus per-weekend buckets. */
export function indexFlightsByWeekend(
  flights: Flight[],
  weekends: WeekendOption[],
  patterns: readonly WeekendPattern[],
  eveningFilters: EveningFlightFilters = NO_EVENING_FILTERS
): WeekendFlightIndex {
  const byWeekendId = new Map<string, Flight[]>();
  for (const weekend of weekends) {
    byWeekendId.set(weekend.id, []);
  }

  if (weekends.length === 0) {
    return { flights: [], byWeekendId };
  }

  const candidates = filterFlightsByEvening(flights, eveningFilters);
  const windows = buildMatchWindows(weekends, patterns);
  const allowedNights =
    patterns.length === 0 ? null : new Set(patterns.map(pattern => pattern.nightsInDest));

  const matched: Flight[] = [];
  const seen = new Set<number>();

  for (const flight of candidates) {
    if (allowedNights && !allowedNights.has(flight.nightsInDest)) continue;

    const depart = parseApiLocalDateTime(flight.localDeparture);
    let returnDepart: Date | null = null;
    const getReturnDepart = () => {
      if (returnDepart) return returnDepart;
      returnDepart = flight.localReturnDeparture
        ? parseApiLocalDateTime(flight.localReturnDeparture)
        : getReturnDepartDate(flight);
      return returnDepart;
    };

    let anyMatch = false;
    let lastBucketId: string | null = null;
    for (const window of windows) {
      if (!matchesWindow(depart, returnDepart, flight.nightsInDest, window, getReturnDepart)) {
        continue;
      }

      if (lastBucketId !== window.weekendId) {
        byWeekendId.get(window.weekendId)?.push(flight);
        lastBucketId = window.weekendId;
      }
      anyMatch = true;
    }

    if (anyMatch && !seen.has(flight.id)) {
      seen.add(flight.id);
      matched.push(flight);
    }
  }

  return { flights: matched, byWeekendId };
}

export function filterFlightsByWeekends(
  flights: Flight[],
  weekends: WeekendOption[],
  patterns: readonly WeekendPattern[],
  eveningFilters: EveningFlightFilters = NO_EVENING_FILTERS
): Flight[] {
  return indexFlightsByWeekend(flights, weekends, patterns, eveningFilters).flights;
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
