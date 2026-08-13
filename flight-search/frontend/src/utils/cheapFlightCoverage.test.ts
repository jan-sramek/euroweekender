import { describe, expect, it } from 'vitest';
import type { Flight } from '../types/flight';
import {
  extraPriceBands,
  keepCheapCoverage,
  maxFlightPrice,
  mergeFlightsById,
  mergeSearchFlights
} from './cheapFlightCoverage';

function flight(id: number, price: number): Flight {
  return {
    id,
    countryTo: 'Spain',
    deepLink: null,
    fareAdults: price,
    nightsInDest: 2,
    price,
    technicalStops: 0,
    durationDeparture: 120,
    durationReturn: 120,
    flyTo: 'BCN',
    flyFrom: 'PRG',
    cityFrom: 'Prague',
    cityTo: 'Barcelona',
    cityCodeFrom: 'PRG',
    cityCodeTo: 'BCN',
    localArrival: '',
    localDeparture: '',
    localReturnDeparture: null,
    localReturnArrival: null,
    availabilitySeats: 2
  };
}

describe('extraPriceBands', () => {
  it('returns nothing once coverage is already reached', () => {
    expect(extraPriceBands(120)).toEqual([]);
    expect(extraPriceBands(140)).toEqual([]);
  });

  it('asks only for the top band when the cheapest batch is already past €90', () => {
    expect(extraPriceBands(95)).toEqual([{ from: 95, to: 120 }]);
  });
});

describe('keepCheapCoverage', () => {
  it('keeps €90–€120 tickets even when thousands of €20–€50 deals exist', () => {
    const cheap = Array.from({ length: 800 }, (_, i) => flight(i, 20 + (i % 30)));
    const mid = [flight(9001, 75), flight(9002, 88)];
    const high = [flight(9003, 105), flight(9004, 118)];

    const kept = keepCheapCoverage([...cheap, ...mid, ...high], 200, 1600);
    const prices = kept.map(item => item.fareAdults);

    expect(Math.max(...prices)).toBeGreaterThanOrEqual(118);
    expect(prices).toContain(75);
    expect(prices).toContain(105);
  });

  it('does not inflate an expensive-hub list that already reaches €120', () => {
    const flights = [flight(1, 80), flight(2, 110), flight(3, 130)];
    expect(keepCheapCoverage(flights, 200, 1600)).toHaveLength(3);
    expect(maxFlightPrice(flights)).toBe(130);
  });
});

describe('mergeFlightsById', () => {
  it('keeps the cheaper duplicate', () => {
    const merged = mergeFlightsById([[flight(1, 90)], [flight(1, 70), flight(2, 80)]]);
    expect(merged).toHaveLength(2);
    expect(merged[0].fareAdults).toBe(70);
  });
});

describe('mergeSearchFlights', () => {
  it('keeps nearer expensive destination weekends instead of later cheap months', () => {
    const laterCheap = Array.from({ length: 1200 }, (_, i) => flight(i + 1, 62));
    const thisWeekend = [flight(9001, 136), flight(9002, 153)];

    const originOnly = mergeSearchFlights([laterCheap, thisWeekend], 1000, 1600, false);
    expect(originOnly.map(item => item.id)).not.toContain(9001);

    const destination = mergeSearchFlights([laterCheap, thisWeekend], 1000, 1600, true);
    expect(destination.map(item => item.id)).toEqual(expect.arrayContaining([9001, 9002]));
    expect(destination).toHaveLength(1202);
  });
});
