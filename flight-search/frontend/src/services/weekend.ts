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

export function getWeekendPatterns(ids: readonly WeekendPatternId[]): WeekendPattern[] {
  if (ids.length === 0) return [];
  const selected = new Set(ids);
  return WEEKEND_PATTERNS.filter(pattern => selected.has(pattern.id));
}

/** Pass nights filters to the API; omit when no trip type is selected. */
export function nightsInDestSearchValues(
  patterns: readonly WeekendPattern[]
): number[] | undefined {
  if (patterns.length === 0) return undefined;
  return [...new Set(patterns.map(pattern => pattern.nightsInDest))];
}

export function formatTripTypesLabel(
  patterns: readonly Pick<WeekendPattern, 'label'>[],
  allLabel: string
): string {
  if (patterns.length === 0) return allLabel;
  return patterns.map(pattern => pattern.label).join(', ');
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

function dateLocale(locale: string): string {
  return locale === 'no' ? 'nb' : locale;
}

export function formatWeekendRange(from: Date, to: Date, locale = 'en'): string {
  const sameMonth = from.getMonth() === to.getMonth();
  const resolved = dateLocale(locale);
  const month = from.toLocaleDateString(resolved, { month: 'short' });
  const toMonth = to.toLocaleDateString(resolved, { month: 'short' });

  if (sameMonth) {
    return `${from.getDate()}–${to.getDate()} ${month}`;
  }

  return `${from.getDate()} ${month} – ${to.getDate()} ${toMonth}`;
}

/** ISO-8601 week number (Monday-start; week 1 contains the year's first Thursday). */
export function getIsoWeekNumber(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function toWeekendOption(
  pattern: WeekendPattern | null,
  departDate: Date,
  locale = 'en'
): WeekendOption {
  const nightsInDest = pattern?.nightsInDest ?? 0;
  const calendarEnd = addDays(departDate, 3);
  const returnDate = pattern ? addDays(departDate, nightsInDest) : calendarEnd;
  const monday = addDays(departDate, 4);
  const range = formatWeekendRange(departDate, pattern ? returnDate : calendarEnd, locale);

  return {
    id: `${pattern?.id ?? 'week'}-${departDate.toISOString().slice(0, 10)}`,
    patternId: pattern?.id ?? null,
    label: pattern ? `${pattern.shortLabel} · ${range}` : `${range} weekend`,
    shortLabel: range,
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
export function getUpcomingCalendarWeeks(count = 12, locale = 'en'): WeekendOption[] {
  const weekends: WeekendOption[] = [];
  const today = startOfDay(new Date());
  let cursor = new Date(today);

  while (weekends.length < count) {
    const thursday = nextWeekday(cursor, 4);

    if (thursday >= today) {
      weekends.push(toWeekendOption(null, thursday, locale));
    }

    cursor = addDays(thursday, 7);
  }

  return weekends;
}

export function getUpcomingWeekends(
  pattern: WeekendPattern,
  count = 12,
  locale = 'en'
): WeekendOption[] {
  const weekends: WeekendOption[] = [];
  const today = startOfDay(new Date());
  let cursor = new Date(today);

  while (weekends.length < count) {
    const departDate = nextWeekday(cursor, pattern.departWeekday);

    if (departDate >= today) {
      weekends.push(toWeekendOption(pattern, departDate, locale));
    }

    cursor = addDays(departDate, 7);
  }

  return weekends;
}

export const DEFAULT_WEEKEND_MONTHS = 6;
/** How far ahead the weekend strip shows (user can select beyond the default). */
export const WEEKEND_OPTIONS_MONTHS = 12;
/** Roughly four weekends per month in the travel strip. */
export const WEEKENDS_PER_MONTH = 4;
export const WEEKEND_OPTIONS_COUNT = WEEKEND_OPTIONS_MONTHS * WEEKENDS_PER_MONTH;

/** Select weekends whose outbound date falls within the next `months` calendar months. */
export function getWeekendIdsForMonths(
  weekends: WeekendOption[],
  months: number
): string[] {
  if (months <= 0 || weekends.length === 0) return [];

  const today = startOfDay(new Date());
  const until = startOfDay(new Date(today));
  until.setMonth(until.getMonth() + months);

  return weekends
    .filter(weekend => {
      const depart = startOfDay(weekend.departDate);
      return depart >= today && depart < until;
    })
    .map(weekend => weekend.id);
}

export function getDefaultWeekendIds(
  weekends: WeekendOption[],
  months = DEFAULT_WEEKEND_MONTHS
): string[] {
  return getWeekendIdsForMonths(weekends, months);
}

/** Align a travel-week pill to a specific stay pattern (depart/return days and nights). */
export function alignWeekendToPattern(
  weekend: WeekendOption,
  pattern: WeekendPattern,
  locale = 'en'
): WeekendOption {
  const weekStart = travelWeekStart(weekend.departDate);
  const departDate = nextWeekday(weekStart, pattern.departWeekday);
  return toWeekendOption(pattern, departDate, locale);
}

function expandWeekendForPatterns(weekend: WeekendOption, patterns: WeekendPattern[]): WeekendOption {
  if (patterns.length === 0) return weekend;

  const aligned = patterns.map(pattern => alignWeekendToPattern(weekend, pattern));
  const departFrom = new Date(Math.min(...aligned.map(item => item.departFrom.getTime())));
  const departTo = new Date(Math.max(...aligned.map(item => item.departTo.getTime())));
  const departDate = new Date(Math.min(...aligned.map(item => item.departDate.getTime())));
  const returnDate = new Date(Math.max(...aligned.map(item => item.returnDate.getTime())));

  return {
    ...weekend,
    departFrom,
    departTo,
    departDate,
    returnDate,
    nightsInDest: 0
  };
}

export function getWeekendOptions(
  patternIds: readonly WeekendPatternId[] = [],
  count = WEEKEND_OPTIONS_COUNT,
  locale = 'en'
): WeekendOption[] {
  if (patternIds.length === 1) {
    return getUpcomingWeekends(getWeekendPattern(patternIds[0]), count, locale);
  }

  const calendarWeeks = getUpcomingCalendarWeeks(count, locale);
  if (patternIds.length === 0) return calendarWeeks;

  return calendarWeeks.map(week => expandWeekendForPatterns(week, getWeekendPatterns(patternIds)));
}

function overlapsMonth(weekend: WeekendOption, year: number, month: number): boolean {
  const monthStart = new Date(year, month, 1);
  const monthEnd = endOfDay(new Date(year, month + 1, 0));
  return weekend.departDate <= monthEnd && weekend.returnDate >= monthStart;
}

function getWeekendsFromCursor(
  pattern: WeekendPattern | null,
  from: Date,
  until: Date,
  locale = 'en'
): WeekendOption[] {
  const weekends: WeekendOption[] = [];
  const today = startOfDay(new Date());
  let cursor = startOfDay(from);
  const end = endOfDay(until);
  let guard = 0;

  while (cursor <= end && guard < 40) {
    guard += 1;
    const departWeekday = pattern?.departWeekday ?? 4;
    const departDate = nextWeekday(cursor, departWeekday);

    if (departDate > end) break;

    if (departDate >= today) {
      weekends.push(toWeekendOption(pattern, departDate, locale));
    }

    cursor = addDays(departDate, 7);
  }

  return weekends;
}

/** Weekends whose trip days overlap the given calendar month (0-based month). */
export function getWeekendsForMonth(
  patternIds: readonly WeekendPatternId[] = [],
  year: number,
  month: number,
  locale = 'en'
): WeekendOption[] {
  const pattern = patternIds.length === 1 ? getWeekendPattern(patternIds[0]) : null;
  // Start a week before the month so trips that begin in the previous month still appear.
  const from = addDays(new Date(year, month, 1), -7);
  const until = new Date(year, month + 1, 7);
  const weekends = getWeekendsFromCursor(pattern, from, until, locale).filter(weekend =>
    overlapsMonth(weekend, year, month)
  );

  if (patternIds.length <= 1) return weekends;

  return weekends.map(weekend => expandWeekendForPatterns(weekend, getWeekendPatterns(patternIds)));
}

/** Inclusive list of calendar days from depart through return for a weekend trip. */
export function getWeekendTripDays(weekend: WeekendOption): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(weekend.departDate);
  const end = startOfDay(weekend.returnDate);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return days;
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

/** Split weekends into contiguous chunks so each API call covers a short date span. */
export function chunkWeekendWindows<T extends Pick<WeekendOption, 'departFrom' | 'departTo'>>(
  weekends: ReadonlyArray<T>,
  chunkSize = 4
): T[][] {
  if (weekends.length === 0 || chunkSize <= 0) return [];

  const sorted = [...weekends].sort(
    (a, b) => a.departFrom.getTime() - b.departFrom.getTime()
  );
  const chunks: T[][] = [];
  for (let i = 0; i < sorted.length; i += chunkSize) {
    chunks.push(sorted.slice(i, i + chunkSize));
  }
  return chunks;
}

export function formatWeekendsLabel(weekends: WeekendOption[], locale = 'en'): string {
  if (weekends.length === 0) return '';
  const labels = weekends.map(weekend =>
    formatWeekendRange(weekend.departDate, weekend.returnDate, locale)
  );
  if (labels.length === 1) return labels[0];
  if (labels.length <= 3) return labels.join(', ');
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

/** Weekend whose trip covers `date`, else the same Thursday-start travel week. */
export function findWeekendIdForDate(
  weekends: WeekendOption[],
  date: Date | null
): string | null {
  if (!date || weekends.length === 0) return null;

  const day = startOfDay(date);
  const covering = weekends.filter(weekend => {
    const from = startOfDay(weekend.departDate);
    const to = startOfDay(weekend.returnDate);
    return day.getTime() >= from.getTime() && day.getTime() <= to.getTime();
  });
  const candidates =
    covering.length > 0
      ? covering
      : weekends.filter(weekend => isSameTravelWeek(weekend.departDate, day));

  if (candidates.length === 0) return null;

  return candidates.reduce((closest, weekend) => {
    const distance = Math.abs(startOfDay(weekend.departDate).getTime() - day.getTime());
    const closestDistance = Math.abs(startOfDay(closest.departDate).getTime() - day.getTime());
    return distance < closestDistance ? weekend : closest;
  }).id;
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
