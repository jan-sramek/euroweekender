import { describe, expect, it } from 'vitest';
import { monthParamFromApiLocal, parseYearMonthParam } from './flightTime';

describe('monthParamFromApiLocal', () => {
  it('reads the calendar month from a Kiwi local timestamp', () => {
    expect(monthParamFromApiLocal('2026-10-16T18:40:00')).toBe('2026-10');
    expect(monthParamFromApiLocal('2026-10-16T18:40:00Z')).toBe('2026-10');
  });

  it('returns null for invalid values', () => {
    expect(monthParamFromApiLocal('')).toBeNull();
    expect(monthParamFromApiLocal('soon')).toBeNull();
    expect(monthParamFromApiLocal('2026-13-01T00:00:00')).toBeNull();
  });
});

describe('parseYearMonthParam', () => {
  it('parses YYYY-MM into a 0-based month', () => {
    expect(parseYearMonthParam('2026-10')).toEqual({ year: 2026, month: 9 });
  });

  it('returns null for invalid values', () => {
    expect(parseYearMonthParam(null)).toBeNull();
    expect(parseYearMonthParam('2026-13')).toBeNull();
    expect(parseYearMonthParam('October')).toBeNull();
  });
});
