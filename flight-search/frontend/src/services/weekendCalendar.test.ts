import { describe, expect, it } from 'vitest';
import {
  buildDayToWeekendId,
  calendarDayKey,
  paintWeekendPull,
  weekendIdsBetween
} from './weekendCalendar';
import { getWeekendOptions } from './weekend';

describe('weekend calendar selection', () => {
  const weekends = getWeekendOptions([], 8);
  const ids = weekends.map(weekend => weekend.id);

  it('lists inclusive weekends between two ids in either direction', () => {
    expect(weekendIdsBetween(weekends, ids[1], ids[3])).toEqual([ids[1], ids[2], ids[3]]);
    expect(weekendIdsBetween(weekends, ids[3], ids[1])).toEqual([ids[1], ids[2], ids[3]]);
  });

  it('returns empty when an id is unknown', () => {
    expect(weekendIdsBetween(weekends, ids[0], 'missing')).toEqual([]);
  });

  it('paints a dragged range onto the selection', () => {
    const added = paintWeekendPull(weekends, [ids[0]], ids[2], ids[4], 'add');
    expect(added).toEqual([ids[0], ids[2], ids[3], ids[4]]);

    const removed = paintWeekendPull(weekends, added, ids[0], ids[2], 'remove');
    expect(removed).toEqual([ids[3], ids[4]]);
  });

  it('maps each trip day to its weekend', () => {
    const map = buildDayToWeekendId(weekends.slice(0, 1));
    const weekend = weekends[0];
    expect(map.get(calendarDayKey(weekend.departDate))).toBe(weekend.id);
    expect(map.get(calendarDayKey(weekend.returnDate))).toBe(weekend.id);
  });
});
