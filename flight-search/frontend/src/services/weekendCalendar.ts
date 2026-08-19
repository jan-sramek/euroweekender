import type { WeekendOption } from '../types/weekend';
import { getWeekendTripDays } from './weekend';

export function calendarDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function sortWeekendIds(ids: string[], weekends: WeekendOption[]): string[] {
  const order = new Map(weekends.map((weekend, index) => [weekend.id, index]));
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

export function weekendIdsBetween(
  weekends: WeekendOption[],
  fromId: string,
  toId: string
): string[] {
  const fromIndex = weekends.findIndex(weekend => weekend.id === fromId);
  const toIndex = weekends.findIndex(weekend => weekend.id === toId);
  if (fromIndex < 0 || toIndex < 0) return [];
  const [lo, hi] = fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
  return weekends.slice(lo, hi + 1).map(weekend => weekend.id);
}

/** Paint every weekend from `fromId` to `toId` (inclusive) onto the current selection. */
export function paintWeekendPull(
  weekends: WeekendOption[],
  currentIds: string[],
  fromId: string,
  toId: string,
  mode: 'add' | 'remove'
): string[] {
  const next = new Set(currentIds);
  for (const id of weekendIdsBetween(weekends, fromId, toId)) {
    if (mode === 'add') next.add(id);
    else next.delete(id);
  }
  return sortWeekendIds([...next], weekends);
}

/** First weekend that covers a calendar day wins if trip ranges overlap. */
export function buildDayToWeekendId(weekends: WeekendOption[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const weekend of weekends) {
    for (const day of getWeekendTripDays(weekend)) {
      const key = calendarDayKey(day);
      if (!map.has(key)) map.set(key, weekend.id);
    }
  }
  return map;
}
