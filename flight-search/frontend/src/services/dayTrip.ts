import type { Flight } from '../types/flight';
import { getReturnDepartDate } from '../utils/flightLeg';
import { parseApiLocalDateTime } from '../utils/flightTime';

/** Show Saturday/Sunday day trips this far ahead. */
export const DAY_TRIP_OPTIONS_MONTHS = 6;
export const MORNING_DEPART_HOUR_FROM = 5;
export const MORNING_DEPART_HOUR_TO = 12;
/** Matches crawl `ReturnDepartTimeFromHour` (evening return). */
export const DAY_TRIP_EVENING_HOUR_FROM = 16;

export const DAY_TRIP_RANGE_PRESETS = [1, 3, 6] as const;

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

function isWeekendDay(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function toDayTripOption(date: Date, locale: string): DayTripOption {
  const day = startOfDay(date);
  const id = `day-${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  return {
    id,
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

/** Upcoming Saturday and Sunday dates within the next `months` calendar months. */
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
    if (isWeekendDay(cursor)) {
      options.push(toDayTripOption(cursor, locale));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return options;
}

/** Select weekend days whose date falls within the next `months` calendar months. */
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

export function getDefaultDayTripIds(
  days: DayTripOption[],
  months = DAY_TRIP_OPTIONS_MONTHS
): string[] {
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
