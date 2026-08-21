import { describe, expect, it } from 'vitest';
import type { Flight } from '../types/flight';
import { groupFlightsByDestination } from './destinationGroups';

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

describe('groupFlightsByDestination', () => {
  it('groups by destination city and keeps the cheapest fare', () => {
    const groups = groupFlightsByDestination([
      flight({ id: 1, fareAdults: 90, price: 90 }),
      flight({ id: 2, fareAdults: 70, price: 70, flyFrom: 'BRQ', cityCodeFrom: 'BRQ', cityFrom: 'Brno' }),
      flight({
        id: 3,
        fareAdults: 120,
        price: 120,
        cityTo: 'Vienna',
        cityCodeTo: 'VIE',
        countryTo: 'Austria',
        flyTo: 'VIE'
      })
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.cityCode).toBe('BCN');
    expect(groups[0]?.minPrice).toBe(70);
    expect(groups[0]?.offerCount).toBe(2);
    expect(groups[0]?.fromCode).toBe('BRQ');
    expect(groups[1]?.cityCode).toBe('VIE');
    expect(groups[1]?.offerCount).toBe(1);
  });

  it('skips rows without a destination city code', () => {
    expect(groupFlightsByDestination([flight({ cityCodeTo: '  ' })])).toEqual([]);
  });
});
