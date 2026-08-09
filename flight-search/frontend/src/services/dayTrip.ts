import type { Flight } from '../types/flight';
import { getReturnDepartDate } from '../utils/flightLeg';
import { parseApiLocalDateTime } from '../utils/flightTime';

/** Horizon for selectable day-trip dates. */
export const DAY_TRIP_OPTIONS_MONTHS = 6;
export const MORNING_DEPART_HOUR_FROM = 5;
export const MORNING_DEPART_HOUR_TO = 12;
/** Matches crawl `ReturnDepartTimeFromHour` (evening return). */
export const DAY_TRIP_EVENING_HOUR_FROM = 16;

export const DAY_TRIP_RANGE_PRESETS = [1, 3, 6] as const;

/**
 * Selectable weekdays for day trips: Saturday and Sunday only
 * (JS getDay: Sun=0 … Sat=6).
 */
export const DAY_TRIP_ALLOWED_WEEKDAYS = new Set([0, 6]);

export interface DayTripOption {
  id: string;
  date: Date;
  shortLabel: string;
  departFrom: Date;
  departTo: Date;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isDayTripSelectableDate(date: Date): boolean {
  return DAY_TRIP_ALLOWED_WEEKDAYS.has(date.getDay());
}

/** Monday-first column index: Mon=0 … Sun=6 */
export function mondayFirstIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** @deprecated Use mondayFirstIndex — kept for older imports. */
export function wednesdayFirstIndex(date: Date): number {
  return (date.getDay() + 4) % 7;
}

export function toDayTripId(date: Date): string {
  const day = startOfDay(date);
  return `day-${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

function toDayTripOption(date: Date, locale: string): DayTripOption {
  const day = startOfDay(date);
  return {
    id: toDayTripId(day),
    date: day,
    shortLabel: day.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }),
    departFrom: startOfDay(day),
    departTo: endOfDay(day)
  };
}

/** Upcoming Saturday/Sunday dates within the next `months` calendar months. */
export function getUpcomingDayTripOptions(
  months = DAY_TRIP_OPTIONS_MONTHS,
  locale = 'en'
): DayTripOption[] {
  const today = startOfDay(new Date());
  const until = startOfDay(new Date(today));
  until.setMonth(until.getMonth() + months);

  const options: DayTripOption[] = [];
  const cursor = new Date(today);

  while (cursor < until) {
    if (isDayTripSelectableDate(cursor)) {
      options.push(toDayTripOption(cursor, locale));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return options;
}

/** Select days whose date falls within the next `months` calendar months. */
export function getDayTripIdsForMonths(days: DayTripOption[], months: number): string[] {
  if (months <= 0 || days.length === 0) return [];

  const today = startOfDay(new Date());
  const until = startOfDay(new Date(today));
  until.setMonth(until.getMonth() + months);

  return days
    .filter(day => {
      const date = startOfDay(day.date);
      return date >= today && date < until;
    })
    .map(day => day.id);
}

export function getDefaultDayTripIds(days: DayTripOption[], months = 1): string[] {
  return getDayTripIdsForMonths(days, months);
}

export function isMorningDeparture(date: Date): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (
    minutes >= MORNING_DEPART_HOUR_FROM * 60 && minutes < MORNING_DEPART_HOUR_TO * 60
  );
}

export function isSameDayRoundTrip(flight: Flight): boolean {
  const outboundDepart = parseApiLocalDateTime(flight.localDeparture);
  const returnDepart = getReturnDepartDate(flight);

  if (flight.nightsInDest === 0 && sameCalendarDay(outboundDepart, returnDepart)) {
    return true;
  }

  return sameCalendarDay(outboundDepart, returnDepart);
}

/** Out morning, back evening, same calendar day. */
export function matchesDayTrip(flight: Flight): boolean {
  if (!isSameDayRoundTrip(flight)) return false;

  const outboundDepart = parseApiLocalDateTime(flight.localDeparture);
  const returnDepart = getReturnDepartDate(flight);

  if (!isMorningDeparture(outboundDepart)) return false;
  return (
    returnDepart.getHours() * 60 + returnDepart.getMinutes() >= DAY_TRIP_EVENING_HOUR_FROM * 60
  );
}

export function filterFlightsByDayTrip(
  flights: Flight[],
  days: DayTripOption[]
): Flight[] {
  if (days.length === 0) return [];

  const dayStarts = days.map(day => startOfDay(day.date).getTime());

  return flights.filter(flight => {
    if (!matchesDayTrip(flight)) return false;
    const depart = startOfDay(parseApiLocalDateTime(flight.localDeparture)).getTime();
    return dayStarts.includes(depart);
  });
}
