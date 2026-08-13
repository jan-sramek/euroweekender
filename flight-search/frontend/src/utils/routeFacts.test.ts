import { describe, expect, it } from 'vitest';
import hubs from '../../public/seo-hub-cities.json';
import coords from '../../public/seo-city-coords.json';
import { lookupCityCoords } from '../data/cityCoordinates';
import { estimateFlightDurationMinutes, formatDurationLabel, haversineKm } from './geo';
import {
  cheapestMonthFromWeekendPrices,
  computeRouteFacts,
  typicalHopRange
} from './routeFacts';

const PRG = { latitude: 50.0755, longitude: 14.4378 };
const VIE = { latitude: 48.2082, longitude: 16.3738 };
const ROM = { latitude: 41.9028, longitude: 12.4964 };
const BCN = { latitude: 41.3851, longitude: 2.1734 };

describe('haversineKm', () => {
  it('estimates Prague–Vienna as a short hop', () => {
    const km = haversineKm(PRG, VIE);
    expect(km).toBeGreaterThan(240);
    expect(km).toBeLessThan(280);
  });

  it('estimates Prague–Rome as a ~900 km hop', () => {
    const km = haversineKm(PRG, ROM);
    expect(km).toBeGreaterThan(880);
    expect(km).toBeLessThan(980);
  });
});

describe('estimateFlightDurationMinutes', () => {
  it('keeps very short hops at a 45–70 minute block time', () => {
    const minutes = estimateFlightDurationMinutes(haversineKm(PRG, VIE));
    expect(minutes).toBeGreaterThanOrEqual(45);
    expect(minutes).toBeLessThanOrEqual(70);
  });

  it('puts Prague–Rome around 1h 45min–2h 15min', () => {
    const minutes = estimateFlightDurationMinutes(haversineKm(PRG, ROM));
    expect(minutes).toBeGreaterThanOrEqual(105);
    expect(minutes).toBeLessThanOrEqual(135);
  });
});

describe('formatDurationLabel', () => {
  it('formats hours and minutes compactly', () => {
    expect(formatDurationLabel(50)).toBe('50min');
    expect(formatDurationLabel(60)).toBe('1h');
    expect(formatDurationLabel(110)).toBe('1h 50min');
  });
});

describe('computeRouteFacts', () => {
  it('returns rounded distance and a duration label', () => {
    const facts = computeRouteFacts(PRG, ROM);
    expect(facts).not.toBeNull();
    expect(facts?.distanceKm).toBeGreaterThan(880);
    expect(facts?.durationLabel).toMatch(/h/);
  });
});

describe('typicalHopRange', () => {
  it('returns a min–max duration across destinations', () => {
    const range = typicalHopRange(
      { code: 'PRG', ...PRG },
      [
        { code: 'VIE', ...VIE },
        { code: 'ROM', ...ROM },
        { code: 'BCN', ...BCN }
      ]
    );
    expect(range).not.toBeNull();
    expect(range!.minMinutes).toBeLessThan(range!.maxMinutes);
  });

  it('ignores the origin city when it appears in destinations', () => {
    const range = typicalHopRange({ code: 'PRG', ...PRG }, [{ code: 'PRG', ...PRG }]);
    expect(range).toBeNull();
  });
});

describe('city coordinates coverage', () => {
  it('has coordinates for every SEO hub', () => {
    const missing = (hubs as Array<{ code: string }>).filter(hub => !lookupCityCoords(hub.code));
    expect(missing.map(hub => hub.code)).toEqual([]);
  });

  it('stores latitude/longitude pairs', () => {
    const prague = (coords as Record<string, number[]>).PRG;
    expect(prague[0]).toBeGreaterThan(49);
    expect(prague[0]).toBeLessThan(51);
    expect(prague[1]).toBeGreaterThan(14);
    expect(prague[1]).toBeLessThan(15);
  });
});

describe('cheapestMonthFromWeekendPrices', () => {
  it('picks the month with the lowest weekend fare', () => {
    const weekends = [
      { id: 'a', departDate: new Date(2026, 0, 9) },
      { id: 'b', departDate: new Date(2026, 0, 16) },
      { id: 'c', departDate: new Date(2026, 2, 6) }
    ];
    const prices = new Map<string, number | null>([
      ['a', 90],
      ['b', 80],
      ['c', 120]
    ]);
    const month = cheapestMonthFromWeekendPrices(weekends, prices);
    expect(month?.getFullYear()).toBe(2026);
    expect(month?.getMonth()).toBe(0);
  });

  it('returns null when no prices are available', () => {
    expect(cheapestMonthFromWeekendPrices([{ id: 'a', departDate: new Date() }], new Map())).toBeNull();
  });
});
