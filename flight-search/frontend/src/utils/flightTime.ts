/**
 * Kiwi "local_*" timestamps are wall-clock times at the airport, but often serialized with a Z suffix.
 * Parse them as naive local components — do not apply UTC conversion.
 */
export function parseApiLocalDateTime(iso: string): Date {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return new Date(iso);
  }

  const [, year, month, day, hour, minute, second = '0'] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

export function formatApiLocalTime(iso: string): string {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '';
}

export function formatApiLocalTripDate(iso: string): string {
  const date = parseApiLocalDateTime(iso);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${weekday} ${day}.${month}.${year}`;
}

export function addLocalDays(iso: string, days: number): Date {
  const date = parseApiLocalDateTime(iso);
  date.setDate(date.getDate() + days);
  return date;
}

export function addLocalMinutes(iso: string, minutes: number): Date {
  const date = parseApiLocalDateTime(iso);
  date.setTime(date.getTime() + minutes * 60_000);
  return date;
}

export function formatLocalDateTimeIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

/** `YYYY-MM` from a Kiwi local timestamp, ignoring timezone suffixes. */
export function monthParamFromApiLocal(iso: string): string | null {
  const match = iso.trim().match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${match[1]}-${match[2]}`;
}

/** `YYYY-MM-DD` from a Kiwi local timestamp, ignoring timezone suffixes. */
export function dateParamFromApiLocal(iso: string): string | null {
  const match = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** Calendar month + outbound date used to open the matching weekend on compare pages. */
export function weekendFlightsFocusParams(localDeparture: string): {
  month: string | null;
  weekend: string | null;
} {
  return {
    month: monthParamFromApiLocal(localDeparture),
    weekend: dateParamFromApiLocal(localDeparture)
  };
}

/** Parse `YYYY-MM` into calendar year + 0-based month. */
export function parseYearMonthParam(
  value: string | null | undefined
): { year: number; month: number } | null {
  const match = value?.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (!Number.isFinite(year) || month < 0 || month > 11) return null;
  return { year, month };
}

/** Parse `YYYY-MM-DD` into a local calendar date. */
export function parseIsoDateParam(value: string | null | undefined): Date | null {
  const match = value?.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(year) || month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}
