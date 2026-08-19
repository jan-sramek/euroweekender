import { describe, expect, it } from 'vitest';
import type { Flight } from '../types/flight';
import { getWeekendOptions, getWeekendPattern, getWeekendPatterns, alignWeekendToPattern } from './weekend';
import { filterFlightsByWeekends, indexFlightsByWeekend, NO_EVENING_FILTERS } from './weekendFilter';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function isoAt(date: Date, hours = 18): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hours)}:00:00`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function flight(id: number, depart: Date, nights: number): Flight {
  const returnDate = addDays(depart, nights);
  return {
    id,
    countryTo: 'Spain',
    deepLink: null,
    fareAdults: 80,
    nightsInDest: nights,
    price: 80,
    technicalStops: 0,
    durationDeparture: 120,
    durationReturn: 120,
    flyTo: 'BCN',
    flyFrom: 'PRG',
    cityFrom: 'Prague',
    cityTo: 'Barcelona',
    cityCodeFrom: 'PRG',
    cityCodeTo: 'BCN',
    localArrival: isoAt(depart, 20),
    localDeparture: isoAt(depart, 18),
    localReturnDeparture: isoAt(returnDate, 18),
    localReturnArrival: isoAt(returnDate, 20),
    availabilitySeats: 4
  };
}

describe('filterFlightsByWeekends', () => {
  it('keeps flights that match any selected trip type in the same travel week', () => {
    const weekend = getWeekendOptions(['fri-sun', 'fri-mon'], 1)[0];
    const friday = alignWeekendToPattern(weekend, getWeekendPattern('fri-sun')).departDate;
    const friSun = flight(1, friday, 2);
    const friMon = flight(2, friday, 3);
    const other = flight(3, addDays(friday, 1), 2);

    const matched = filterFlightsByWeekends(
      [friSun, friMon, other],
      [weekend],
      getWeekendPatterns(['fri-sun', 'fri-mon']),
      NO_EVENING_FILTERS
    );

    expect(matched.map(item => item.id).sort()).toEqual([1, 2]);
  });

  it('still filters to a single trip type when only one is selected', () => {
    const weekend = getWeekendOptions(['fri-sun'], 1)[0];
    const friday = weekend.departDate;
    const friSun = flight(1, friday, 2);
    const friMon = flight(2, friday, 3);

    const matched = filterFlightsByWeekends(
      [friSun, friMon],
      [weekend],
      [getWeekendPattern('fri-sun')],
      NO_EVENING_FILTERS
    );

    expect(matched.map(item => item.id)).toEqual([1]);
  });

  it('indexes matching flights onto their travel week once', () => {
    const weekend = getWeekendOptions(['fri-sun', 'fri-mon'], 1)[0];
    const friday = alignWeekendToPattern(weekend, getWeekendPattern('fri-sun')).departDate;
    const friSun = flight(1, friday, 2);
    const friMon = flight(2, friday, 3);

    const indexed = indexFlightsByWeekend(
      [friSun, friMon],
      [weekend],
      getWeekendPatterns(['fri-sun', 'fri-mon']),
      NO_EVENING_FILTERS
    );

    expect(indexed.flights.map(item => item.id).sort()).toEqual([1, 2]);
    expect(indexed.byWeekendId.get(weekend.id)?.map(item => item.id).sort()).toEqual([1, 2]);
  });
});
