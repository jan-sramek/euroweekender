import { calendarDayKey } from './weekendCalendar';
import type { DayTripOption } from './dayTrip';

export function sortDayIds(ids: string[], days: DayTripOption[]): string[] {
  const order = new Map(days.map((day, index) => [day.id, index]));
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

export function dayIdsBetween(
  days: DayTripOption[],
  fromId: string,
  toId: string
): string[] {
  const fromIndex = days.findIndex(day => day.id === fromId);
  const toIndex = days.findIndex(day => day.id === toId);
  if (fromIndex < 0 || toIndex < 0) return [];
  const [lo, hi] = fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
  return days.slice(lo, hi + 1).map(day => day.id);
}

/** Paint every day from `fromId` to `toId` (inclusive) onto the current selection. */
export function paintDayTripPull(
  days: DayTripOption[],
  currentIds: string[],
  fromId: string,
  toId: string,
  mode: 'add' | 'remove'
): string[] {
  const next = new Set(currentIds);
  for (const id of dayIdsBetween(days, fromId, toId)) {
    if (mode === 'add') next.add(id);
    else next.delete(id);
  }
  return sortDayIds([...next], days);
}

export function buildDayToDayTripId(days: DayTripOption[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const day of days) {
    map.set(calendarDayKey(day.date), day.id);
  }
  return map;
}
