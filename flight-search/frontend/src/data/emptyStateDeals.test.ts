import { describe, expect, it } from 'vitest';
import { pickEmptyStateDeals, type SeoDealSnapshot } from './emptyStateDeals';

const snapshot: SeoDealSnapshot = {
  destinationsByOrigin: {
    PRG: [
      { code: 'CPH', name: 'Copenhagen', minPrice: 59 },
      { code: 'ROM', name: 'Rome', minPrice: 71 },
      { code: 'LON', name: 'London', minPrice: 97 }
    ],
    VIE: [
      { code: 'BCN', name: 'Barcelona', minPrice: 80 },
      { code: 'ROM', name: 'Rome', minPrice: 90 }
    ],
    BER: [{ code: 'AMS', name: 'Amsterdam', minPrice: 40 }]
  }
};

const popular = [
  { from: { code: 'PRG', name: 'Prague' }, to: { code: 'ROM', name: 'Rome' } },
  { from: { code: 'VIE', name: 'Vienna' }, to: { code: 'BCN', name: 'Barcelona' } },
  { from: { code: 'LON', name: 'London' }, to: { code: 'PAR', name: 'Paris' } }
];

describe('pickEmptyStateDeals', () => {
  it('prefers cheapest destinations from selected origins', () => {
    const deals = pickEmptyStateDeals(snapshot, ['PRG'], { limit: 2 });
    expect(deals.map(deal => `${deal.from.code}-${deal.to.code}`)).toEqual(['PRG-CPH', 'PRG-ROM']);
    expect(deals[0].minPrice).toBe(59);
  });

  it('fills remaining slots from priced popular routes', () => {
    const deals = pickEmptyStateDeals(snapshot, [], { limit: 2, popularRoutes: popular });
    expect(deals.map(deal => `${deal.from.code}-${deal.to.code}`)).toEqual(['PRG-ROM', 'VIE-BCN']);
    expect(deals[0].minPrice).toBe(71);
  });

  it('falls back to cheapest snapshot pairs, then unpriced popular routes', () => {
    const deals = pickEmptyStateDeals(snapshot, [], { limit: 5, popularRoutes: popular });
    expect(deals.map(deal => `${deal.from.code}-${deal.to.code}`)).toEqual([
      'PRG-ROM',
      'VIE-BCN',
      'BER-AMS',
      'PRG-CPH',
      'VIE-ROM'
    ]);
    expect(deals.some(deal => deal.from.code === 'LON' && deal.to.code === 'PAR')).toBe(false);
  });

  it('skips same-city pairs and duplicates', () => {
    const messy: SeoDealSnapshot = {
      destinationsByOrigin: {
        PRG: [
          { code: 'PRG', name: 'Prague', minPrice: 10 },
          { code: 'ROM', name: 'Rome', minPrice: 71 }
        ]
      }
    };
    const deals = pickEmptyStateDeals(messy, ['PRG'], {
      limit: 3,
      popularRoutes: [{ from: { code: 'PRG', name: 'Prague' }, to: { code: 'ROM', name: 'Rome' } }]
    });
    expect(deals).toHaveLength(1);
    expect(deals[0].to.code).toBe('ROM');
  });

  it('still returns popular routes when the snapshot is missing', () => {
    const deals = pickEmptyStateDeals(null, [], { limit: 2, popularRoutes: popular });
    expect(deals).toHaveLength(2);
    expect(deals[0].minPrice).toBeNull();
    expect(deals[0].from.name).toBe('Prague');
  });
});
