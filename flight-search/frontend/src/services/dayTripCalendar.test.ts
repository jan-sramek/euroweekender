import { describe, expect, it } from 'vitest';
import { calendarDayKey } from './weekendCalendar';
import { getUpcomingDayTripOptions } from './dayTrip';
import { buildDayToDayTripId, dayIdsBetween, paintDayTripPull } from './dayTripCalendar';

describe('day-trip calendar selection', () => {
  const days = getUpcomingDayTripOptions(2, 'en');
  const ids = days.map(day => day.id);

  it('lists inclusive days between two ids in either direction', () => {
    expect(dayIdsBetween(days, ids[1], ids[3])).toEqual([ids[1], ids[2], ids[3]]);
    expect(dayIdsBetween(days, ids[3], ids[1])).toEqual([ids[1], ids[2], ids[3]]);
  });

  it('returns empty when an id is unknown', () => {
    expect(dayIdsBetween(days, ids[0], 'missing')).toEqual([]);
  });

  it('paints a dragged range onto the selection', () => {
    const added = paintDayTripPull(days, [ids[0]], ids[2], ids[4], 'add');
    expect(added).toEqual([ids[0], ids[2], ids[3], ids[4]]);

    const removed = paintDayTripPull(days, added, ids[0], ids[2], 'remove');
    expect(removed).toEqual([ids[3], ids[4]]);
  });

  it('maps each selectable date to its day-trip id', () => {
    const map = buildDayToDayTripId(days.slice(0, 1));
    expect(map.get(calendarDayKey(days[0].date))).toBe(days[0].id);
  });
});
