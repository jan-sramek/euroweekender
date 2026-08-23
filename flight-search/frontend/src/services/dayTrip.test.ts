import { describe, expect, it } from 'vitest';
import type { Flight } from '../types/flight';
import {
  DAY_TRIP_EVENING_HOUR_FROM,
  DAY_TRIP_OPTIONS_MONTHS,
  filterFlightsByDayTrip,
  getDayTripIdsForMonths,
  getUpcomingDayTripOptions,
  isDayTripSelectableDate,
  isMorningDeparture,
  matchesDayTrip,
  mondayFirstIndex
} from './dayTrip';

function flight(
  partial: Partial<Flight> & Pick<Flight, 'localDeparture' | 'localReturnDeparture'>
): Flight {
  return {
    id: 1,
    flyFrom: 'PRG',
    flyTo: 'VIE',
    cityFrom: 'Prague',
    cityTo: 'Vienna',
    cityCodeFrom: 'PRG',
    cityCodeTo: 'VIE',
    countryFrom: 'CZ',
    countryTo: 'AT',
    localArrival: partial.localDeparture,
    localReturnArrival: partial.localReturnDeparture,
    nightsInDest: 0,
    price: 99,
    fareAdults: 99,
    technicalStops: 0,
    technicalStopsReturn: 0,
    durationDeparture: 60,
    durationReturn: 60,
    availabilitySeats: 9,
    deepLink: 'https://example.com',
    ...partial
  };
}

describe('dayTrip options', () => {
  it('includes only Saturday and Sunday for the next 6 months', () => {
    const days = getUpcomingDayTripOptions(DAY_TRIP_OPTIONS_MONTHS, 'en');
    expect(days.length).toBeGreaterThan(40);
    expect(days.every(day => day.date.getDay() === 0 || day.date.getDay() === 6)).toBe(true);
    expect(days.every(day => isDayTripSelectableDate(day.date))).toBe(true);
  });

  it('orders calendar columns Monday-first', () => {
    expect(mondayFirstIndex(new Date(2024, 0, 1))).toBe(0); // Mon
    expect(mondayFirstIndex(new Date(2024, 0, 7))).toBe(6); // Sun
    expect(mondayFirstIndex(new Date(2024, 0, 6))).toBe(5); // Sat
  });

  it('selects ids within the next N months', () => {
    const days = getUpcomingDayTripOptions(6, 'en');
    const oneMonth = getDayTripIdsForMonths(days, 1);
    const sixMonths = getDayTripIdsForMonths(days, 6);
    expect(oneMonth.length).toBeGreaterThan(0);
    expect(sixMonths.length).toBeGreaterThan(oneMonth.length);
    expect(sixMonths).toEqual(days.map(day => day.id));
  });
});

describe('dayTrip filters', () => {
  it('accepts morning outbound and evening return on the same day', () => {
    const f = flight({
      localDeparture: '2026-08-10T07:30:00',
      localReturnDeparture: '2026-08-10T18:15:00',
      nightsInDest: 0
    });
    expect(matchesDayTrip(f)).toBe(true);
  });

  it('rejects afternoon outbound', () => {
    const f = flight({
      localDeparture: '2026-08-10T14:00:00',
      localReturnDeparture: '2026-08-10T20:00:00'
    });
    expect(matchesDayTrip(f)).toBe(false);
  });

  it('rejects early afternoon return before evening window', () => {
    const f = flight({
      localDeparture: '2026-08-10T08:00:00',
      localReturnDeparture: `2026-08-10T${String(DAY_TRIP_EVENING_HOUR_FROM - 1).padStart(2, '0')}:30:00`
    });
    expect(matchesDayTrip(f)).toBe(false);
  });

  it('filters by selected calendar days', () => {
    const days = getUpcomingDayTripOptions(3, 'en');
    const target = days[1];
    const other = days[2];
    const fmt = (date: Date, hour: string) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}T${hour}`;
    };

    const matching = flight({
      localDeparture: fmt(target.date, '08:00:00'),
      localReturnDeparture: fmt(target.date, '19:00:00')
    });
    const otherDay = flight({
      localDeparture: fmt(other.date, '08:00:00'),
      localReturnDeparture: fmt(other.date, '19:00:00')
    });

    const filtered = filterFlightsByDayTrip([matching, otherDay], [target]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toBe(matching);
  });

  it('treats 05:00–11:59 as morning', () => {
    expect(isMorningDeparture(new Date(2026, 7, 10, 5, 0))).toBe(true);
    expect(isMorningDeparture(new Date(2026, 7, 10, 11, 59))).toBe(true);
    expect(isMorningDeparture(new Date(2026, 7, 10, 12, 0))).toBe(false);
  });

  it('accepts a stay of at least 6 hours at the destination', () => {
    const f = flight({
      localDeparture: '2026-08-10T07:30:00',
      localArrival: '2026-08-10T10:00:00',
      localReturnDeparture: '2026-08-10T16:00:00'
    });
    expect(matchesDayTrip(f)).toBe(true);
  });

  it('rejects a stay shorter than 6 hours', () => {
    const f = flight({
      localDeparture: '2026-08-10T07:30:00',
      localArrival: '2026-08-10T12:30:00',
      localReturnDeparture: '2026-08-10T18:00:00'
    });
    expect(matchesDayTrip(f)).toBe(false);
  });

  it('keeps late-morning trips unless long-day is on', () => {
    const f = flight({
      localDeparture: '2026-08-10T10:30:00',
      localArrival: '2026-08-10T12:00:00',
      localReturnDeparture: '2026-08-10T20:00:00'
    });
    expect(matchesDayTrip(f)).toBe(true);
    expect(matchesDayTrip(f, { longDay: true })).toBe(false);
  });

  it('keeps early-out late-back trips when long-day is on', () => {
    const f = flight({
      localDeparture: '2026-08-10T07:00:00',
      localArrival: '2026-08-10T09:00:00',
      localReturnDeparture: '2026-08-10T18:00:00'
    });
    expect(matchesDayTrip(f, { longDay: true })).toBe(true);
  });

  it('rejects a 16:00 return when long-day is on', () => {
    const f = flight({
      localDeparture: '2026-08-10T07:30:00',
      localArrival: '2026-08-10T10:00:00',
      localReturnDeparture: '2026-08-10T16:00:00'
    });
    expect(matchesDayTrip(f)).toBe(true);
    expect(matchesDayTrip(f, { longDay: true })).toBe(false);
  });
});
