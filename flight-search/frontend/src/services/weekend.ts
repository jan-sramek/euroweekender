import type { WeekendOption, WeekendPattern, WeekendPatternId } from '../types/weekend';
import { OUTBOUND_SPILL_HOURS } from '../types/weekend';

export const WEEKEND_PATTERNS: WeekendPattern[] = [
  {
    id: 'fri-sun',
    label: 'Friday – Sunday',
    shortLabel: 'Fri–Sun',
    departWeekday: 5,
    returnWeekday: 0,
    eveningHour: 0,
    outboundSpillHours: OUTBOUND_SPILL_HOURS,
    nightsInDest: 2
  },
  {
    id: 'thu-sun',
    label: 'Thursday – Sunday',
    shortLabel: 'Thu–Sun',
    departWeekday: 4,
    returnWeekday: 0,
    eveningHour: 0,
    outboundSpillHours: OUTBOUND_SPILL_HOURS,
    nightsInDest: 3
  },
  {
    id: 'wed-sun',
    label: 'Wednesday – Sunday',
    shortLabel: 'Wed–Sun',
    departWeekday: 3,
    returnWeekday: 0,
    eveningHour: 0,
    outboundSpillHours: OUTBOUND_SPILL_HOURS,
    nightsInDest: 4
  },
  {
    id: 'fri-mon',
    label: 'Friday – Monday',
    shortLabel: 'Fri–Mon',
    departWeekday: 5,
    returnWeekday: 1,
    eveningHour: 0,
    outboundSpillHours: OUTBOUND_SPILL_HOURS,
    nightsInDest: 3
  },
  {
    id: 'fri-tue',
    label: 'Friday – Tuesday',
    shortLabel: 'Fri–Tue',
    departWeekday: 5,
    returnWeekday: 2,
    eveningHour: 0,
    outboundSpillHours: OUTBOUND_SPILL_HOURS,
    nightsInDest: 4
  }
];

export function getWeekendPattern(id: WeekendPatternId): WeekendPattern {
  return WEEKEND_PATTERNS.find(p => p.id === id) ?? WEEKEND_PATTERNS[0];
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addHours(date: Date, hours: number): Date {
  const copy = new Date(date);
  copy.setTime(copy.getTime() + hours * 60 * 60 * 1000);
  return copy;
}

function patternDepartTo(departDate: Date, spillHours: number): Date {
  if (spillHours <= 0) {
    return endOfDay(departDate);
  }

  return addHours(addDays(startOfDay(departDate), 1), spillHours);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function nextWeekday(from: Date, weekday: number): Date {
  const date = startOfDay(from);
  const delta = (weekday - date.getDay() + 7) % 7;
  return addDays(date, delta);
}

function formatRange(from: Date, to: Date): string {
  const sameMonth = from.getMonth() === to.getMonth();
  const month = from.toLocaleDateString('en-GB', { month: 'short' });
  const toMonth = to.toLocaleDateString('en-GB', { month: 'short' });

  if (sameMonth) {
    return `${from.getDate()}–${to.getDate()} ${month}`;
  }

  return `${from.getDate()} ${month} – ${to.getDate()} ${toMonth}`;
}

function toWeekendOption(pattern: WeekendPattern | null, departDate: Date): WeekendOption {
  const nightsInDest = pattern?.nightsInDest ?? 0;
  const calendarEnd = addDays(departDate, 3);
  const returnDate = pattern ? addDays(departDate, nightsInDest) : calendarEnd;
  const monday = addDays(departDate, 4);

  return {
    id: `${pattern?.id ?? 'week'}-${departDate.toISOString().slice(0, 10)}`,
    patternId: pattern?.id ?? null,
    label: pattern
      ? `${pattern.shortLabel} · ${formatRange(departDate, returnDate)}`
      : `${formatRange(departDate, calendarEnd)} weekend`,
    shortLabel: formatRange(departDate, pattern ? returnDate : calendarEnd),
    departDate,
    departFrom: startOfDay(departDate),
    departTo: pattern ? patternDepartTo(departDate, pattern.outboundSpillHours) : endOfDay(monday),
    returnDate,
    returnFrom: startOfDay(returnDate),
    returnTo: endOfDay(returnDate),
    departWeekday: pattern?.departWeekday ?? departDate.getDay(),
    returnWeekday: pattern?.returnWeekday ?? calendarEnd.getDay(),
    eveningHour: pattern?.eveningHour ?? 0,
    outboundSpillHours: pattern?.outboundSpillHours ?? 0,
    nightsInDest
  };
}

/** Calendar weeks (Thu–Sun label) without trip-type filtering. */
export function getUpcomingCalendarWeeks(count = 12): WeekendOption[] {
  const weekends: WeekendOption[] = [];
  const today = startOfDay(new Date());
  let cursor = new Date(today);

  while (weekends.length < count) {
    const thursday = nextWeekday(cursor, 4);

    if (thursday >= today) {
      weekends.push(toWeekendOption(null, thursday));
    }

    cursor = addDays(thursday, 7);
  }

  return weekends;
}

export function getUpcomingWeekends(pattern: WeekendPattern, count = 12): WeekendOption[] {
  const weekends: WeekendOption[] = [];
  const today = startOfDay(new Date());
  let cursor = new Date(today);

  while (weekends.length < count) {
    const departDate = nextWeekday(cursor, pattern.departWeekday);

    if (departDate >= today) {
      weekends.push(toWeekendOption(pattern, departDate));
    }

    cursor = addDays(departDate, 7);
  }

  return weekends;
}

export const DEFAULT_WEEKEND_COUNT = 4;

export function getDefaultWeekendIds(
  weekends: WeekendOption[],
  count = DEFAULT_WEEKEND_COUNT
): string[] {
  return weekends.slice(0, count).map(weekend => weekend.id);
}

export function getWeekendOptions(patternId: WeekendPatternId | null, count = 12): WeekendOption[] {
  return patternId
    ? getUpcomingWeekends(getWeekendPattern(patternId), count)
    : getUpcomingCalendarWeeks(count);
}

function parseDepartDateFromWeekendId(weekendId: string): Date | null {
  const match = weekendId.match(/(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;

  const [year, month, day] = match[1].split('-').map(Number);
  return new Date(year, month - 1, day);
}

function travelWeekStart(date: Date): Date {
  const start = startOfDay(date);
  const daysSinceThursday = (start.getDay() - 4 + 7) % 7;
  return addDays(start, -daysSinceThursday);
}

function isSameTravelWeek(a: Date, b: Date): boolean {
  return travelWeekStart(a).getTime() === travelWeekStart(b).getTime();
}

/** Union date range covering all selected weekends (for API fetch). */
export function getWeekendSearchRange(
  weekends: ReadonlyArray<Pick<WeekendOption, 'departFrom' | 'departTo'>>
): { departFrom: Date; departTo: Date } | null {
  if (weekends.length === 0) return null;

  return {
    departFrom: new Date(Math.min(...weekends.map(weekend => weekend.departFrom.getTime()))),
    departTo: new Date(Math.max(...weekends.map(weekend => weekend.departTo.getTime())))
  };
}

export function formatWeekendsLabel(weekends: WeekendOption[]): string {
  if (weekends.length === 0) return '';
  if (weekends.length === 1) return weekends[0].shortLabel;
  if (weekends.length <= 3) return weekends.map(weekend => weekend.shortLabel).join(', ');
  return `${weekends.length} weekends`;
}

/** Keep the same travel weeks when switching trip-type filters. */
export function findMatchingWeekendIds(
  weekends: WeekendOption[],
  previousIds: string[]
): string[] {
  if (weekends.length === 0) return [];

  const matched = previousIds
    .map(id => findMatchingWeekendId(weekends, id))
    .filter((id, index, all) => id && all.indexOf(id) === index);

  return matched.length > 0 ? matched : getDefaultWeekendIds(weekends);
}

/** Keep the same travel week when switching trip-type filters. */
export function findMatchingWeekendId(
  weekends: WeekendOption[],
  previousWeekendId: string | null
): string {
  if (weekends.length === 0) return '';
  if (!previousWeekendId) return weekends[0].id;

  const previousDepart = parseDepartDateFromWeekendId(previousWeekendId);
  if (!previousDepart) return weekends[0].id;

  const sameWeek = weekends.filter(weekend => isSameTravelWeek(weekend.departDate, previousDepart));
  const candidates = sameWeek.length > 0 ? sameWeek : weekends;

  const best = candidates.reduce((closest, weekend) => {
    const distance = Math.abs(weekend.departDate.getTime() - previousDepart.getTime());
    const closestDistance = Math.abs(closest.departDate.getTime() - previousDepart.getTime());
    return distance < closestDistance ? weekend : closest;
  });

  return best.id;
}
