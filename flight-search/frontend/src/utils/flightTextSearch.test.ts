import { describe, expect, it } from 'vitest';
import type { Flight } from '../types/flight';
import { filterFlightsByTextQuery } from './flightTextSearch';

function flight(overrides: Partial<Flight>): Flight {
  return {
    id: 1,
    countryTo: 'Spain',
    countryFrom: 'Czechia',
    deepLink: null,
    fareAdults: 80,
    nightsInDest: 2,
    price: 80,
    technicalStops: 0,
    technicalStopsReturn: 0,
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
    availabilitySeats: 2,
    ...overrides
  };
}

describe('filterFlightsByTextQuery', () => {
  const flights = [
    flight({ id: 1 }),
    flight({
      id: 2,
      cityTo: 'Vienna',
      cityCodeTo: 'VIE',
      countryTo: 'Austria',
      flyTo: 'VIE'
    }),
    flight({
      id: 3,
      cityTo: 'München',
      cityCodeTo: 'MUC',
      countryTo: 'Germany',
      flyTo: 'MUC'
    })
  ];

  it('returns all flights for empty query', () => {
    expect(filterFlightsByTextQuery(flights, '  ')).toHaveLength(3);
  });

  it('matches city code and name', () => {
    expect(filterFlightsByTextQuery(flights, 'bcn').map(f => f.id)).toEqual([1]);
    expect(filterFlightsByTextQuery(flights, 'vienna').map(f => f.id)).toEqual([2]);
  });

  it('folds diacritics', () => {
    expect(filterFlightsByTextQuery(flights, 'munchen').map(f => f.id)).toEqual([3]);
  });

  it('requires all tokens', () => {
    expect(filterFlightsByTextQuery(flights, 'prague spain').map(f => f.id)).toEqual([1]);
    expect(filterFlightsByTextQuery(flights, 'barcelona austria')).toHaveLength(0);
  });
});
