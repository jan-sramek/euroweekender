import { describe, expect, it } from 'vitest';
import {
  dateParamFromApiLocal,
  monthParamFromApiLocal,
  parseIsoDateParam,
  parseYearMonthParam,
  weekendFlightsFocusParams
} from './flightTime';

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

describe('dateParamFromApiLocal', () => {
  it('reads the calendar date from a Kiwi local timestamp', () => {
    expect(dateParamFromApiLocal('2026-10-16T18:40:00')).toBe('2026-10-16');
    expect(dateParamFromApiLocal('2026-10-16T18:40:00Z')).toBe('2026-10-16');
  });

  it('returns null for invalid values', () => {
    expect(dateParamFromApiLocal('')).toBeNull();
    expect(dateParamFromApiLocal('2026-13-01T00:00:00')).toBeNull();
    expect(dateParamFromApiLocal('2026-10-32T00:00:00')).toBeNull();
  });
});

describe('weekendFlightsFocusParams', () => {
  it('returns month and weekend date together', () => {
    expect(weekendFlightsFocusParams('2026-10-16T18:40:00Z')).toEqual({
      month: '2026-10',
      weekend: '2026-10-16'
    });
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

describe('parseIsoDateParam', () => {
  it('parses YYYY-MM-DD as a local calendar date', () => {
    expect(parseIsoDateParam('2026-10-16')).toEqual(new Date(2026, 9, 16));
  });

  it('returns null for invalid values', () => {
    expect(parseIsoDateParam(null)).toBeNull();
    expect(parseIsoDateParam('2026-10')).toBeNull();
    expect(parseIsoDateParam('2026-02-31')).toBeNull();
  });
});
