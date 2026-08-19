import { describe, expect, it } from 'vitest';
import {
  chunkWeekendWindows,
  alignWeekendToPattern,
  formatTripTypesLabel,
  getDefaultWeekendIds,
  getWeekendIdsForMonths,
  getWeekendOptions,
  getWeekendPattern,
  getWeekendPatterns,
  getWeekendSearchRange,
  sharedNightsInDest,
  WEEKEND_OPTIONS_COUNT
} from './weekend';

function windowAt(daysFromToday: number) {
  const departFrom = new Date();
  departFrom.setHours(0, 0, 0, 0);
  departFrom.setDate(departFrom.getDate() + daysFromToday);
  const departTo = new Date(departFrom);
  departTo.setDate(departTo.getDate() + 4);
  departTo.setHours(23, 59, 59, 999);
  return { departFrom, departTo };
}

describe('chunkWeekendWindows', () => {
  it('returns empty for empty input', () => {
    expect(chunkWeekendWindows([])).toEqual([]);
  });

  it('keeps a short list as a single chunk', () => {
    const weekends = [windowAt(1), windowAt(8), windowAt(15)];
    expect(chunkWeekendWindows(weekends, 4)).toHaveLength(1);
    expect(chunkWeekendWindows(weekends, 4)[0]).toHaveLength(3);
  });

  it('splits longer lists into month-sized chunks', () => {
    const weekends = Array.from({ length: 10 }, (_, i) => windowAt(1 + i * 7));
    const chunks = chunkWeekendWindows(weekends, 4);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(4);
    expect(chunks[1]).toHaveLength(4);
    expect(chunks[2]).toHaveLength(2);
  });

  it('sorts by departFrom before chunking', () => {
    const a = windowAt(20);
    const b = windowAt(1);
    const chunks = chunkWeekendWindows([a, b], 4);
    expect(chunks[0][0].departFrom.getTime()).toBe(b.departFrom.getTime());
    expect(chunks[0][1].departFrom.getTime()).toBe(a.departFrom.getTime());
  });
});

describe('getWeekendSearchRange', () => {
  it('returns the union of chunk windows', () => {
    const weekends = [windowAt(1), windowAt(15)];
    const range = getWeekendSearchRange(weekends);
    expect(range?.departFrom.getTime()).toBe(weekends[0].departFrom.getTime());
    expect(range?.departTo.getTime()).toBe(weekends[1].departTo.getTime());
  });
});

describe('getDefaultWeekendIds', () => {
  it('matches the next-6-months preset selection', () => {
    const weekends = getWeekendOptions([], WEEKEND_OPTIONS_COUNT);
    const defaults = getDefaultWeekendIds(weekends);
    const sixMonths = getWeekendIdsForMonths(weekends, 6);
    expect(defaults).toEqual(sixMonths);
    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults.length).toBeLessThan(weekends.length);
  });
});

describe('getWeekendOptions', () => {
  it('uses pattern-specific ids for a single trip type', () => {
    const weekends = getWeekendOptions(['fri-sun'], 4);
    expect(weekends.length).toBe(4);
    expect(weekends.every(weekend => weekend.id.startsWith('fri-sun-'))).toBe(true);
    expect(weekends.every(weekend => weekend.nightsInDest === 2)).toBe(true);
  });

  it('keeps calendar-week ids when multiple trip types are selected', () => {
    const none = getWeekendOptions([], 4);
    const multi = getWeekendOptions(['fri-sun', 'wed-sun'], 4);
    expect(multi.map(weekend => weekend.id)).toEqual(none.map(weekend => weekend.id));
  });

  it('widens the search window to cover every selected pattern', () => {
    const multi = getWeekendOptions(['fri-sun', 'wed-sun'], 1)[0];
    const alignedFri = alignWeekendToPattern(multi, getWeekendPattern('fri-sun'));
    const alignedWed = alignWeekendToPattern(multi, getWeekendPattern('wed-sun'));
    expect(multi.departFrom.getTime()).toBe(
      Math.min(alignedFri.departFrom.getTime(), alignedWed.departFrom.getTime())
    );
    expect(multi.departTo.getTime()).toBe(
      Math.max(alignedFri.departTo.getTime(), alignedWed.departTo.getTime())
    );
  });
});

describe('sharedNightsInDest', () => {
  it('returns undefined when patterns disagree or none are selected', () => {
    expect(sharedNightsInDest([])).toBeUndefined();
    expect(sharedNightsInDest(getWeekendPatterns(['fri-sun', 'fri-mon']))).toBeUndefined();
  });

  it('returns the shared night count', () => {
    expect(sharedNightsInDest(getWeekendPatterns(['thu-sun', 'fri-mon']))).toBe(3);
  });
});

describe('formatTripTypesLabel', () => {
  it('joins selected labels and falls back to the all-types copy', () => {
    expect(formatTripTypesLabel([], 'all trip types')).toBe('all trip types');
    expect(formatTripTypesLabel(getWeekendPatterns(['fri-sun', 'fri-mon']), 'all trip types')).toBe(
      'Friday – Sunday, Friday – Monday'
    );
  });
});
