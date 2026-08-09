import { describe, expect, it } from 'vitest';
import { chunkWeekendWindows, getWeekendSearchRange } from './weekend';

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
