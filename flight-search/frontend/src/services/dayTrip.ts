import type { Flight } from '../types/flight';
import { getReturnDepartDate } from '../utils/flightLeg';
import { parseApiLocalDateTime } from '../utils/flightTime';

export const DAY_TRIP_OPTIONS_COUNT = 21;
export const MORNING_DEPART_HOUR_FROM = 5;
export const MORNING_DEPART_HOUR_TO = 12;
/** Matches crawl `ReturnDepartTimeFromHour` (evening return). */
export const DAY_TRIP_EVENING_HOUR_FROM = 16;

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

export function getUpcomingDayTripOptions(
  count = DAY_TRIP_OPTIONS_COUNT,
  locale = 'en'
): DayTripOption[] {
  const today = startOfDay(new Date());
  const options: DayTripOption[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const id = `day-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    options.push({
      id,
      date,
      shortLabel: date.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }),
      departFrom: startOfDay(date),
      departTo: endOfDay(date)
    });
  }

  return options;
}

export function getDefaultDayTripIds(days: DayTripOption[], count = 7): string[] {
  return days.slice(0, count).map(day => day.id);
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
